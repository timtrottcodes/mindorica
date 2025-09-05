import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TopicModel } from "../../models/flashcard";

@Component({
  selector: 'app-topic-tree',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <li>
      <a [routerLink]="['/flashcard-manager', topic.id]">{{ topic.name }}</a>
      <ul *ngIf="subtopics.length > 0">
        <ng-container *ngFor="let sub of subtopics">
          <app-topic-tree [topic]="sub" [topics]="topics"></app-topic-tree>
        </ng-container>
      </ul>
    </li>
  `
})
export class TopicTree {
  @Input() topic!: TopicModel;
  @Input() topics: TopicModel[] = [];

  get subtopics(): TopicModel[] {
    return this.topics.filter(t => t.parent === this.topic.id);
  }
}
