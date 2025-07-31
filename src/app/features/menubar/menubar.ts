import { Component } from '@angular/core';
import { ImportsModule } from '../import';
import { MenuItem } from 'primeng/api';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-menubar',
  imports: [ImportsModule, RouterOutlet],
  templateUrl: './menubar.html',
  styleUrl: './menubar.scss',
})
export class Menubar {
  selectedAction: string = '';

  // MenuBar items (horizontal navigation)
  menubarItems: MenuItem[] = [];

  // Popup Menu items
  menuItems: MenuItem[] = [];

  // Side Menu items
  sideMenuItems: MenuItem[] = [];

  // Top menu for combined layout
  topMenuItems: MenuItem[] = [];

  // Side navigation for combined layout
  sideNavigationItems: MenuItem[] = [];

  ngOnInit() {
    // MenuBar items
    this.menubarItems = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        command: () => this.onMenuAction('Home clicked'),
      },
      {
        label: 'Products',
        icon: 'pi pi-box',
        items: [
          {
            label: 'Electronics',
            icon: 'pi pi-desktop',
            command: () => this.onMenuAction('Electronics selected'),
          },
          {
            label: 'Clothing',
            icon: 'pi pi-tag',
            command: () => this.onMenuAction('Clothing selected'),
          },
          {
            separator: true,
          },
          {
            label: 'All Categories',
            icon: 'pi pi-list',
            command: () => this.onMenuAction('All Categories selected'),
          },
        ],
      },
      {
        label: 'Services',
        icon: 'pi pi-cog',
        items: [
          {
            label: 'Support',
            icon: 'pi pi-question-circle',
            command: () => this.onMenuAction('Support selected'),
          },
          {
            label: 'Consultation',
            icon: 'pi pi-comments',
            command: () => this.onMenuAction('Consultation selected'),
          },
        ],
      },
      {
        label: 'About',
        icon: 'pi pi-info-circle',
        command: () => this.onMenuAction('About clicked'),
      },
    ];

    // Popup Menu items
    this.menuItems = [
      {
        label: 'New',
        icon: 'pi pi-plus',
        items: [
          {
            label: 'Document',
            icon: 'pi pi-file',
            command: () => this.onMenuAction('New Document'),
          },
          {
            label: 'Folder',
            icon: 'pi pi-folder',
            command: () => this.onMenuAction('New Folder'),
          },
        ],
      },
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.onMenuAction('Edit clicked'),
      },
      {
        separator: true,
      },
      {
        label: 'Settings',
        icon: 'pi pi-cog',
        command: () => this.onMenuAction('Settings opened'),
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => this.onMenuAction('Logout clicked'),
      },
    ];

    // Side Menu items
    this.sideMenuItems = [
      {
        label: 'Dashboard',
        icon: 'pi pi-chart-line',
        command: () => this.onMenuAction('Dashboard opened'),
      },
      {
        label: 'Reports',
        icon: 'pi pi-file-pdf',
        items: [
          {
            label: 'Sales Report',
            command: () => this.onMenuAction('Sales Report opened'),
          },
          {
            label: 'User Report',
            command: () => this.onMenuAction('User Report opened'),
          },
        ],
      },
      {
        separator: true,
      },
      {
        label: 'Settings',
        icon: 'pi pi-cog',
        command: () => this.onMenuAction('Settings opened'),
      },
    ];

    // Top menu for combined layout
    this.topMenuItems = [
      {
        label: 'File',
        items: [
          {
            label: 'New',
            icon: 'pi pi-plus',
            command: () => this.onMenuAction('File > New'),
          },
          {
            label: 'Open',
            icon: 'pi pi-folder-open',
            command: () => this.onMenuAction('File > Open'),
          },
          { separator: true },
          {
            label: 'Exit',
            icon: 'pi pi-times',
            command: () => this.onMenuAction('File > Exit'),
          },
        ],
      },
      {
        label: 'Edit',
        items: [
          {
            label: 'Copy',
            icon: 'pi pi-copy',
            command: () => this.onMenuAction('Edit > Copy'),
          },
          {
            label: 'Paste',
            icon: 'pi pi-clone',
            command: () => this.onMenuAction('Edit > Paste'),
          },
        ],
      },
      {
        label: 'View',
        items: [
          {
            label: 'Zoom In',
            icon: 'pi pi-search-plus',
            command: () => this.onMenuAction('View > Zoom In'),
          },
          {
            label: 'Zoom Out',
            icon: 'pi pi-search-minus',
            command: () => this.onMenuAction('View > Zoom Out'),
          },
        ],
      },
    ];

    // Side navigation for combined layout
    this.sideNavigationItems = [
      {
        label: 'Create Test',
        icon: 'pi pi-users',
        command: () => this.onMenuAction('Create Test'),
        routerLink: './create-test',
      },
      {
        label: 'Analytics',
        icon: 'pi pi-chart-bar',
        command: () => this.onMenuAction('Analytics page'),
      },
      {
        label: 'Projects',
        icon: 'pi pi-briefcase',
        command: () => this.onMenuAction('Projects page'),
      },
      {
        label: 'Team',
        icon: 'pi pi-users',
        command: () => this.onMenuAction('Team page'),
      },
      {
        separator: true,
      },
      {
        label: 'Account',
        icon: 'pi pi-user',
        command: () => this.onMenuAction('Account settings'),
      },
    ];
  }

  onMenuAction(action: string) {
    this.selectedAction = action;
    console.log('Menu action:', action);
  }
}
