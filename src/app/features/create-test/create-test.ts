import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ImportsModule } from '../import';
import { HttpClient } from '@angular/common/http';
import { MenuItem, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import Groq from 'groq-sdk';
import { environment } from '../../../environments/environment';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EMPTY, merge } from 'rxjs';
import { GoogleGenAI } from '@google/genai';
import { parse } from 'path';

interface TestDetails {
  title: string;
  instructions: string;
  subject: string;
  totalMarks: number;
  duration: number | null;
  difficulty: string;
  grade: string;
  numberOfQuestions: number;
  isDifficultyWise: boolean;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswers: number[];
  marks: number;
  explanation: string;
  isMultipleCorrect: boolean;
}

const groq = new Groq({
  apiKey: environment.GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const ai = new GoogleGenAI({ apiKey: `${environment.GEMINI_API_KEY}` });

@Component({
  selector: 'app-create-test',
  imports: [ImportsModule],
  templateUrl: './create-test.html',
  styleUrl: './create-test.scss',
  providers: [MessageService],
})
export class CreateTest implements OnInit {
  @ViewChild(Toast) toast!: Toast;
  activeStep = 1;
  loading = false;
  aiGenerating = false;
  showQuestionDialog = false;
  editingQuestion: Question | null = null;
  currentQuestion: Question | null = null;
  correctAnswerStates: boolean[] = [false, false, false, false];
  singleCorrectAnswer = 0;
  testDetailsForm: FormGroup;
  questionForm: FormGroup;
  editIndex: number | null = null;

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.testDetailsForm = this.fb.group({
      title: ['', Validators.required],
      instructions: [''],
      subject: ['', Validators.required],
      duration: [null],
      grade: '',
      noOfQuestions: [0, [Validators.required, Validators.min(1)]],
      easyQuestions: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      mediumQuestions: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      hardQuestions: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      totalMarks: [0, Validators.required],
      questions: this.fb.array([]),
    });

    this.questionForm = this.fb.group({
      questionText: ['', Validators.required],
      options: this.fb.array([]),
      marks: [1, [Validators.required, Validators.min(1)]],
      explanation: [''],
      answerType: ['', Validators.required],
      correctOptionId: [''],
    });
  }

  actionItems = [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => {
        // this.messageService.add({
        //   severity: 'success',
        //   summary: 'Updated',
        //   detail: 'Data Updated',
        //   life: 3000,
        // });
      },
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => {
        // this.messageService.add({
        //   severity: 'success',
        //   summary: 'Updated',
        //   detail: 'Data Updated',
        //   life: 3000,
        // });
      },
    },
  ];

  questionsFormArray(): FormArray {
    return this.testDetailsForm.get('questions') as FormArray;
  }

  getOptionsFormArray(questionIndex: number): FormArray {
    return this.questionsFormArray()
      .at(questionIndex)
      .get('options') as FormArray;
  }

  get optionsFormArray(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  steps: MenuItem[] = [
    { label: 'Basic Details' },
    { label: 'Add Questions' },
    { label: 'Review & Generate' },
  ];

  subjects = [
    { label: 'Mathematics', value: 'mathematics' },
    { label: 'Physics', value: 'physics' },
    { label: 'Science', value: 'science' },
    { label: 'English', value: 'english' },
    { label: 'History', value: 'history' },
    { label: 'Geography', value: 'geography' },
    { label: 'Computer Science', value: 'computer_science' },
  ];

  answerTypes = [
    { label: 'Single-Correct', value: 'Single-Correct' },
    { label: 'Multiple-Correct', value: 'Multiple-Correct' },
  ];
  difficultyLevels = [
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
  ];

  ngOnInit() {
    merge(
      this.testDetailsForm.get('easyQuestions')?.valueChanges || EMPTY,
      this.testDetailsForm.get('mediumQuestions')?.valueChanges || EMPTY,
      this.testDetailsForm.get('hardQuestions')?.valueChanges || EMPTY
    ).subscribe(() => {
      this.updateTotalNoOfQuestions();
    });
  }

  updateTotalNoOfQuestions() {
    const easyQ = this.testDetailsForm.get('easyQuestions')?.value || 0;
    const mediumQ = this.testDetailsForm.get('mediumQuestions')?.value || 0;
    const hardQ = this.testDetailsForm.get('hardQuestions')?.value || 0;

    this.testDetailsForm
      .get('noOfQuestions')
      ?.setValue(easyQ + mediumQ + hardQ, { emitEvent: false });
  }

  calculateTotalMarks(): number {
    return this.questionsFormArray().controls.reduce(
      (sum, q) => sum + (q.get('marks')?.value || 0),
      0
    );
  }

  isStepValid(): boolean {
    switch (this.activeStep) {
      case 0:
        return !!this.testDetailsForm.valid;
      case 1:
        return this.questionsFormArray.length > 0;
      case 2:
        return true;
      default:
        return false;
    }
  }

  createOptionGroup(optionValue: any = {}): FormGroup {
    return this.fb.group({
      id: [optionValue.id || this.generateUniqueId()],
      optionText: [optionValue.optionText || '', Validators.required],
    });
  }
  generateUniqueId(): any {
    return Math.random().toString(36).substr(2, 9);
  }

  resetQuestionForm() {
    this.questionForm.reset({
      marks: 1,
      answerType: 'Single-Correct',
    });
    this.optionsFormArray.clear();
    for (let i = 0; i < 4; i++) {
      this.optionsFormArray.push(this.createOptionGroup());
    }
  }

  addNewQuestion() {
    this.editIndex = null;
    this.resetQuestionForm
    console.log('Adding new question with form', this.questionForm.value);

    // this.currentQuestion = this.createNewQuestion();
    this.editingQuestion = null;
    this.showQuestionDialog = true;
    // this.resetCorrectAnswerStates();
  }

  editQuestion(index: number) {
    this.editIndex = index;
    console.log("question array: ", this.questionsFormArray().at(index).value);
    this.resetQuestionForm();
    this.questionForm.patchValue(this.questionsFormArray().at(index).value);
    console.log(
      'Editing question at index',
      index,
      'with form',
      this.questionForm.value
    );
    // this.currentQuestion = this.questionsFormArray.at(index).value;
    // this.editingQuestion = this.currentQuestion;
    this.showQuestionDialog = true;
    // this.setupCorrectAnswerStates();
  }

  deleteQuestion(index: number) {
    this.questionsFormArray().removeAt(index);
    this.messageService.add({
      severity: 'success',
      summary: 'Deleted',
      detail: 'Question removed successfully',
    });
  }

  createQuestionForm(questionFormValue: any): FormGroup {
    return this.fb.group({
      questionText: [questionFormValue.questionText, Validators.required],
      options: this.fb.array(questionFormValue.options.map((opt: any) => this.createOptionGroup(opt))),
      marks: [
        questionFormValue.marks || 1,
        [Validators.required, Validators.min(1)],
      ],
      explanation: [questionFormValue.explanation || ''],
      answerType: [questionFormValue.answerType || '', Validators.required],
      correctOptionId: [questionFormValue.correctOptionId || ''],
    });

  }

  saveQuestion() {
    console.log('Saving question:', this.questionForm.value);
    const controls = this.questionForm.controls;
    const invalid: string[] = [];
    for (const name in controls) {
      if (controls[name].invalid) {
        console.error(`Control ${name} is invalid`);
      }
    }
    if (this.questionForm.invalid) return;

    if (this.editIndex !== null) {
      this.questionsFormArray()
        .at(this.editIndex)
        .patchValue(this.questionForm.value);
    } else {
      this.questionsFormArray().push(
        this.createQuestionForm(this.questionForm.value)
      );
    }

    this.closeQuestionDialog();
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Question saved successfully',
    });
  }

  closeQuestionDialog() {
    this.showQuestionDialog = false;
    this.currentQuestion = null;
    this.editingQuestion = null;
  }


  async generateQuestionsWithAI() {
    this.aiGenerating = true;

    try {
      const prompt = this.buildAIPrompt();
      console.log('AI Prompt:', prompt);

      await ai.models
        .generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        })
        .then((response: any) => {
          console.log('AI response received:', response.text);
          const generatedQuestions = this.parseAIResponse(response.text);

          generatedQuestions.forEach((q: any) => {
            this.questionsFormArray().push(this.createQuestionForm(q));
            // q.options.forEach((opt: any) =>
            //   this.optionsFormArray.push(this.createOptionGroup(opt))
            // );

          });

          console.log('questionsFormArray', this.questionsFormArray().value);

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Generated ${generatedQuestions.length} questions successfully`,
          });
        });

      // const response = await groq.chat.completions.create({
      //   messages: [
      //     {
      //       role: 'system',
      //       content:
      //         'You are a helpful assistant that generates test questions. Return questions in JSON format.',
      //     },
      //     {
      //       role: 'user',
      //       content: prompt,
      //     },
      //   ],
      //   model: 'gemma2-9b-it',
      //   temperature: 0.7,
      //   max_tokens: 2000,
      // });
    } catch (error) {
      console.error('AI Generation Error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail:
          'Failed to generate questions. Please try again or add manually.',
      });
    } finally {
      this.aiGenerating = false;
    }
  }

  buildAIPrompt(): string {
    return `Generate MCQ Test with ${
      this.testDetailsForm.get('easyQuestions')?.value
    }  Easy Questions, ${
      this.testDetailsForm.get('mediumQuestions')?.value
    } Medium Questions, ${
      this.testDetailsForm.get('hardQuestions')?.value
    } Hard Questions for a ${this.testDetailsForm.get('subject')?.value} test.
      Grade Level: ${this.testDetailsForm.get('grade')?.value || 'General'},
      Topic: ${this.testDetailsForm.get('title')?.value}

      Return the questions in this exact JSON format:
      [
        {
          "questionText": "Question text here",
          "options": [{"id": "1abc", "optionText": "Option A"}, {"id": "2def", "optionText": "Option B"}],
          "marks": 1,
          "explanation": "Brief explanation of the correct answer",
          "answerType": "Single-Correct" or "Multiple-Correct",
          "correctOptionId": "1abc"
        }
      ]

      Make sure to:
      1. Create questions appropriate for the subject and difficulty level
      2. Include a mix of question types
      3. Ensure all options are plausible and randomize the correct answer position
      4. Provide clear explanation.
      5. Only return the Array of JSON objects without any additional text. (not even triple backticks and 'json' tag)`;
  }

  parseAIResponse(content: string) {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      console.log('Parsed AI response:', parsed);
      return parsed;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return [];
    }
  }

  getSubjectLabel(value: string): string {
    const subject = this.subjects.find((s) => s.value === value);
    return subject ? subject.label : value;
  }

  getDifficultySeverity(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'danger';
      default:
        return 'info';
    }
  }

  generateTest() {
    this.loading = true;

    // Prepare test data
    const testData = {
      ...this.testDetailsForm,
      questions: this.questionsFormArray().value,
      actualTotalMarks: this.calculateTotalMarks(),
      createdAt: new Date().toISOString(),
    };

    // Simulate API call
    setTimeout(() => {
      this.loading = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Test generated successfully!',
      });

      // Here you would typically navigate to the test view or save
      console.log('Generated Test:', testData);

      // Reset form after successful generation
      // this.resetForm();
    }, 1500);
  }

  // resetForm() {
  //   this.activeIndex = 0;
  //   this.testDetailsForm = {
  //     title: '',
  //     instructions: '',
  //     subject: '',
  //     totalMarks: 0,
  //     duration: null,
  //     difficulty: 'medium',
  //     grade: '',
  //     numberOfQuestions: 10,
  //     isDifficultyWise: false,
  //   };
  //   this.questions = [];
  // }

  // Utility method for string conversion in template
  String = String;
}
