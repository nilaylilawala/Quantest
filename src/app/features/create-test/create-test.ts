import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ImportsModule } from '../import';
import { HttpClient } from '@angular/common/http';
import { MenuItem, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import Groq from 'groq-sdk';
import { environment } from '../../../environments/environment';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EMPTY, merge } from 'rxjs';

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
      options: this.fb.array([
      ]),
      marks: [1, [Validators.required, Validators.min(1)]],
      explanation: [''],
      answerType: ['', Validators.required],
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

  get questionsFormArray(): FormArray {
    return this.testDetailsForm.get('questions') as FormArray;
  }

  getOptionsFormArray(questionIndex: number): FormArray {
    return this.questionsFormArray.at(questionIndex).get('options') as FormArray;
  }


  createOptionFormGroup(option: any): FormGroup {
    return this.fb.group({
      text: [option.text, Validators.required],
      isCorrect: [option.isCorrect]
    });
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
    return this.questionsFormArray.controls.reduce((sum, q) => sum + (q.get('marks')?.value || 0), 0);
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

  addNewQuestion() {
    this.questionForm.reset({
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ],
      marks: 1,
      answerType: 'Single-Correct',
    });

    // this.currentQuestion = this.createNewQuestion();
    // this.editingQuestion = null;
    // this.showQuestionDialog = true;
    // this.resetCorrectAnswerStates();
  }

  editQuestion(index: number) {
    this.currentQuestion = this.questionsFormArray.at(index).value;
    this.editingQuestion = this.currentQuestion;
    this.showQuestionDialog = true;
    this.setupCorrectAnswerStates();
  }

  deleteQuestion(index: number) {
    this.questionsFormArray.removeAt(index);
    this.messageService.add({
      severity: 'success',
      summary: 'Deleted',
      detail: 'Question removed successfully',
    });
  }

  saveQuestion() {
    if (!this.currentQuestion || !this.isQuestionValid()) return;

    if (this.editingQuestion) {
      const index = this.questionsFormArray.controls.findIndex(
        (q) => q.value.id === this.editingQuestion!.id
      );
      if (index !== -1) {
        this.questionsFormArray.at(index).patchValue(this.currentQuestion);
      }
    } else {
      this.questionsFormArray.push(this.currentQuestion);
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

  isQuestionValid(): boolean {
    if (!this.currentQuestion) return false;

    return !!(
      this.currentQuestion.question &&
      this.currentQuestion.options.every((opt) => opt.trim()) &&
      this.currentQuestion.correctAnswers.length > 0 &&
      this.currentQuestion.marks > 0
    );
  }

  setupCorrectAnswerStates() {
    if (this.currentQuestion) {
      this.correctAnswerStates = [false, false, false, false];
      this.currentQuestion.correctAnswers.forEach((index) => {
        this.correctAnswerStates[index] = true;
      });
      if (
        !this.currentQuestion.isMultipleCorrect &&
        this.currentQuestion.correctAnswers.length > 0
      ) {
        this.singleCorrectAnswer = this.currentQuestion.correctAnswers[0];
      }
    }
  }

  resetCorrectAnswerStates() {
    this.correctAnswerStates = [false, false, false, false];
    this.singleCorrectAnswer = 0;
  }

  updateCorrectAnswers() {
    if (this.currentQuestion) {
      this.currentQuestion.correctAnswers = [];
      this.correctAnswerStates.forEach((isCorrect, index) => {
        if (isCorrect) {
          this.currentQuestion!.correctAnswers.push(index);
        }
      });
    }
  }

  updateSingleCorrectAnswer() {
    if (this.currentQuestion) {
      this.currentQuestion.correctAnswers = [this.singleCorrectAnswer];
    }
  }

  async generateQuestionsWithAI() {
    this.aiGenerating = true;

    try {
      const prompt = this.buildAIPrompt();

      const response = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that generates test questions. Return questions in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'gemma2-9b-it',
        temperature: 0.7,
        max_tokens: 2000,
      });

      console.log(response.choices[0].message.content);

      const generatedQuestions = this.parseAIResponse(
        response.choices[0].message.content!
      );


      generatedQuestions.forEach((q: any) => {
        const optionsArray = this.fb.array(
          q.options.map((opt: any) => this.fb.group(opt))
        );
        q.options = optionsArray;
        this.questionsFormArray.push(this.fb.group(q)); 
        console.log("questionFormArray", this.questionsFormArray.value);
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Generated ${generatedQuestions.length} questions successfully`,
      });
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
    return `Generate ${
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
          "options": [{"optionText": "Option A", "isCorrect": true}, {"optionText": "Option B", "isCorrect": false}, {"optionText": "Option C", "isCorrect": false}, {"optionText": "Option D", "isCorrect": false}],
          "marks": 1,
          "explanation": "Brief explanation of the correct answer",
          "answerType": "Single-Correct" or "Multiple-Correct",
        }
      ]

      Make sure to:
      1. Create questions appropriate for the subject and difficulty level
      2. Include a mix of question types
      3. Ensure all options are plausible
      4. Provide clear explanations
      5. Use correctAnswers as an array of indices (0-3) for the correct options`;
  }

  parseAIResponse(content: string) {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((q: any) => ({
        questionText: q.questionText,
        options: q.options,
        marks: q.marks || 1,
        explanation: q.explanation || '',
        answerType: q.answerType || '',
      }));
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
      questions: this.questionsFormArray.value,
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
