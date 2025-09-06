import { Router } from "@angular/router";
import { TopicModel } from "../../models/flashcard";
import { FlashcardService } from "../../services/flashcard";
import { Component, OnInit } from "@angular/core";
import { from } from "rxjs";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

interface TopicNode {
  topic: TopicModel;
  count: number; // total flashcards for this node if any
  children: TopicNode[];
}

@Component({
  selector: 'app-study',
  templateUrl: './study.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./study.scss'],
})
export class Study implements OnInit {
  topicCounts: { topic: TopicModel; count: number }[] = [];
  filteredTopics: { topic: TopicModel; count: number }[] = [];
  categories: string[] = [];
  selectedCategory: string = 'All';
  topicTree: TopicNode[] = [];
  topicStars: Map<string, number> = new Map();
  todayIndex = new Date().getDay();

  // Fake player stats (replace with real service later)
  player = {
    level: 0,
    exp: 0,
    words: 0,
    streak: 0,
    longestStreak: 0
  };

  weekDays = [
    { label: 'S', checked: false },
    { label: 'M', checked: false },
    { label: 'T', checked: false },
    { label: 'W', checked: false },
    { label: 'T', checked: true },
    { label: 'F', checked: false },
    { label: 'S', checked: false },
  ];

  constructor(
    private flashcardService: FlashcardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    from(this.flashcardService.getTopics()).subscribe(async (allTopics) => {
      if (!allTopics.length) {
        this.router.navigate(['/topic-manager']);
        return;
      }

      // Load card counts for all topics in parallel
      const topicWithCounts = (
        await Promise.all(
          allTopics.map(async (topic) => {
            const cards = await this.flashcardService.getFlashcardsForTopic(topic.id);
            return { topic, count: cards.length };
          })
        )
      ).filter((tc) => tc.count > 0);

      this.topicCounts = topicWithCounts;

      // Build category list
      const categorySet = new Set<string>();
      for (const tc of this.topicCounts) {
        const [category] = tc.topic.id.split('/');
        categorySet.add(category);
      }

      this.categories = ['All', ...Array.from(categorySet).sort()];

      const countsMap = new Map<string, number>();
      this.topicCounts.forEach(tc => countsMap.set(tc.topic.id, tc.count));
      this.topicTree = this.buildTopicTree(allTopics, countsMap);

        for (const tc of this.topicCounts) {
        const avg = await this.flashcardService.getAverageScorePercent(tc.topic.id);
        const stars = Math.round((avg / 100) * 5); // 0–5 stars
        this.topicStars.set(tc.topic.id, stars);
      }

      const streaks = await this.flashcardService.getGlobalStreaks();
      this.player.streak = streaks.current;
      this.player.longestStreak = streaks.longest;
      this.weekDays = await this.flashcardService.getWeeklyStreak();

      this.applyFilter();
    });
  }

  applyFilter(): void {
    this.filteredTopics =
      this.selectedCategory === 'All'
        ? this.topicCounts
        : this.topicCounts.filter((tc) =>
            tc.topic.id.startsWith(this.selectedCategory + '/')
          );
  }

  startStudy(topic: string): void {
    this.router.navigate(['flashcard-viewer', topic]);
  }

  buildTopicTree(allTopics: TopicModel[], topicCounts: Map<string, number>): TopicNode[] {
    const nodeMap = new Map<string, TopicNode>();
  
    // Step 1: create a node for every topic
    allTopics.forEach(t => {
      nodeMap.set(t.id, {
        topic: t,
        count: topicCounts.get(t.id) || 0,
        children: []
      });
    });
  
    // Step 2: attach nodes to parents
    nodeMap.forEach(node => {
      if (node.topic.parent) {
        const parentNode = nodeMap.get(node.topic.parent);
        if (parentNode) {
          parentNode.children.push(node);
        }
      }
    });
  
    // Step 3: roots are nodes without a parent or whose parent is missing
    const roots: TopicNode[] = [];
    nodeMap.forEach(node => {
      if (!node.topic.parent || !nodeMap.has(node.topic.parent)) {
        roots.push(node);
      }
    });
  
    // ✅ Step 4: for root topics with flashcards, add a self node
    roots.forEach(root => {
      if (root.count > 0) {
        root.children.unshift({
          topic: { ...root.topic, id: root.topic.id + '-self' }, // avoid collision
          count: root.count,
          children: []
        });
      }
    });
  
    // sort children alphabetically (TODO add sequence field)
    const sortChildren = (nodes: TopicNode[]) => {
      nodes.sort((a, b) => a.topic.name.localeCompare(b.topic.name));
      nodes.forEach(n => sortChildren(n.children));
    };
    sortChildren(roots);
  
    return roots;
  }
  

  getStarsForTopic(topicId: string): number {
    return this.topicStars.get(topicId) ?? 0;
  }
}
