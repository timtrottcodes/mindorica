import { Component } from '@angular/core';
import { FlashcardModel, TopicModel } from '../../models/flashcard';
import { ActivatedRoute } from '@angular/router';
import { FlashcardService } from '../../services/flashcard';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-import',
  imports: [CommonModule, FormsModule],
  templateUrl: './import.html',
  styleUrl: './import.scss',
})
export class Import {
  allTopics: TopicModel[] = [];
  flashcards: FlashcardModel[] = [];
  public importOverride: boolean = false;

  selectedFile: File | null = null;
  isZipFile = false;

  constructor(
    private route: ActivatedRoute,
    private flashcardService: FlashcardService
  ) {}

  ngOnInit(): void {
    this.allTopics = this.flashcardService.getTopics();
    this.flashcards = this.flashcardService.getFlashcards();
  }

  hasData(): boolean {
    return this.allTopics.length > 0 && this.flashcards.length > 0;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.selectedFile = file;

    const isZip = file.type === 'application/zip' || file.name.endsWith('.zip');
    const isJson =
      file.type === 'application/json' || file.name.endsWith('.json');

    if (!isZip && !isJson) {
      alert('Unsupported file type. Please upload a .json or .zip file.');
      this.selectedFile = null;
      return;
    }

    this.isZipFile = isZip;

    // We'll handle the actual import parsing later
    console.log('Selected file:', file.name);
  }

  async exportTopicsAndFlashcards(): Promise<void> {
    const exportData: ExportData = {
      topics: this.allTopics,
      cards: this.flashcards,
    };

    const hasAssets = exportData.cards.some(
      (card) =>
        card.imageUrl?.startsWith('data:') || card.audioUrl?.startsWith('data:')
    );

    if (!hasAssets) {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      saveAs(blob, 'flashcards-export.json');
      return;
    }

    const zip = new JSZip();
    const assetsFolder = zip.folder('assets');
    const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    zip.file('flashcards-export.json', jsonBlob);

    // Add embedded image/audio data
    for (const [index, card] of exportData.cards.entries()) {
      if (card.imageUrl?.startsWith('data:')) {
        const imgData = card.imageUrl.split(',')[1];
        const ext = card.imageUrl.match(/data:image\/(\w+);/)?.[1] || 'png';
        assetsFolder?.file(`image-${index}.${ext}`, imgData, { base64: true });
      }

      if (card.audioUrl?.startsWith('data:')) {
        const audioData = card.audioUrl.split(',')[1];
        const ext = card.audioUrl.match(/data:audio\/(\w+);/)?.[1] || 'mp3';
        assetsFolder?.file(`audio-${index}.${ext}`, audioData, {
          base64: true,
        });
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'flashcards-export.zip');
  }

  async importData(file: File | null): Promise<void> {
    if (!file) {
      alert('No file selected. Please upload a .json or .zip file.');
      return;
    }

    const isZip = file.name.endsWith('.zip');
    const isJson = file.name.endsWith('.json');

    if (!isZip && !isJson) {
      alert('Invalid file format. Please upload a .json or .zip file.');
      return;
    }

    try {
      let importPayload: ExportData;
      let mediaAssets: { [url: string]: string } = {};

      if (isJson) {
        const text = await file.text();
        importPayload = JSON.parse(text);
      } else {
        const zip = await JSZip.loadAsync(file);
        const jsonFile = zip.file(/\.json$/i)?.[0];
        if (!jsonFile) throw new Error('No JSON file found in ZIP');

        const jsonData = await jsonFile.async('string');
        importPayload = JSON.parse(jsonData);

        for (const key in zip.files) {
          if (
            key.endsWith('.mp3') ||
            key.endsWith('.png') ||
            key.endsWith('.jpg') ||
            key.endsWith('.jpeg')
          ) {
            const base64 = await zip.files[key].async('base64');
            mediaAssets[key] = `data:${this.getMimeType(key)};base64,${base64}`;
          }
        }

        // Patch imported cards with embedded base64 media
        importPayload.cards = importPayload.cards.map((card) => {
          const imageUrl =
            card.imageUrl && mediaAssets[card.imageUrl]
              ? mediaAssets[card.imageUrl]
              : card.imageUrl;

          const audioUrl =
            card.audioUrl && mediaAssets[card.audioUrl]
              ? mediaAssets[card.audioUrl]
              : card.audioUrl;

          return {
            ...card,
            imageUrl,
            audioUrl,
          };
        });
      }

      // Conflict detection
      const existingTopicIds = new Set(this.allTopics.map((t) => t.id));
      const existingCardIds = new Set(this.flashcards.map((c) => c.id));

      const conflictingTopics = importPayload.topics.filter((t) =>
        existingTopicIds.has(t.id)
      );
      const conflictingCards = importPayload.cards.filter((c) =>
        existingCardIds.has(c.id)
      );

      const shouldMerge = !this.importOverride;
      if (
        shouldMerge &&
        (conflictingTopics.length > 0 || conflictingCards.length > 0)
      ) {
        const confirmMsg = `
Conflicts detected:
- ${conflictingTopics.length} topic(s)
- ${conflictingCards.length} card(s)

Do you want to overwrite these?
      `.trim();

        const confirmed = confirm(confirmMsg);
        if (!confirmed) return;
      }

      if (this.importOverride) {
        // Overwrite localStorage
        this.allTopics = importPayload.topics;
        this.flashcards = importPayload.cards;
      } else {
        // Merge
        const mergedTopics = [
          ...this.allTopics.filter(
            (t) => !conflictingTopics.find((ct) => ct.id === t.id)
          ),
          ...importPayload.topics,
        ];
        const mergedCards = [
          ...this.flashcards.filter(
            (c) => !conflictingCards.find((cc) => cc.id === c.id)
          ),
          ...importPayload.cards,
        ];

        this.allTopics = mergedTopics;
        this.flashcards = mergedCards;
      }

      this.flashcardService.saveFlashcardsAndTopics(
        this.allTopics,
        this.flashcards
      );
      alert('Import successful!');
    } catch (err) {
      console.error(err);
      alert(
        'Failed to import data: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  }

  deleteAllData(): void {
    localStorage.clear();
    alert('All data has been deleted.');
    window.location.reload();
  }

  getMimeType(fileName: string): string {
    if (fileName.endsWith('.mp3')) return 'audio/mpeg';
    if (fileName.endsWith('.png')) return 'image/png';
    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg'))
      return 'image/jpeg';
    return 'application/octet-stream';
  }

  loadDemoData(): void {
    const base64FlagImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAABkCAMAAABThTnCAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABhQTFRF+vr6swAF5J+m0Vho9NjbxSk+vgAm////21s6JAAAAcxJREFUeNrs2tFuwyAMBVBjG/L/fzxIV6nSthRfAvFS81T1oTqySUpyTeRzbS6XU1ewghWsYAUrWMEKVrD+CYu0LvLEUhbJZV9ZhNUDq5pKqmtXpX3lcdkgS+Upeln1K+ELWZx/mp6yzBexSP5CfcP0ChaXA9QDxutZh6V6uoQWs+QtaoehjcRYlLtUrWC6jtWtgl0QS7pVrY+rWBYV6AJYbFJVl6xgUTGyCrC97CyxqpA2mllqVlUXT2cJwsqzWUixgHJZWYKx8lwWQSp7uYwsRlkylZVBVik0kUUoytpFG4vhYhm7aGMJzsqfx8oDLJrGwne89VJcx9JpLPXJimrdYMs7vUHEXf4Of9WaXB5snB4D8UOz8RnDyFKfjxhgF5Oxh3d5fIXKZS6WncU+X42QvVz2YgHvt+y7C4gNbvOS0vxKt9AalulqhFQYS5PLuKAe6rvDFSwlA6Mo7esjnN2hCRn17Hs86cRjzreB4kCcOBIKaz6EpTKQVg9F6HIQoQ+UapS1Ucv206+5/tgoxPB4BreSvdDaZ+HRXz1hmIX2WZbHwEgbZzljmuWk0R9SVmY+bfgn5reCFaxgBStYwQpWsD6TtTmtlsv1JcAAqJJ+vxE2oAIAAAAASUVORK5CYII=';
    const base64CowAudio = 'data:audio/mpeg;base64,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'

    const demoTopic: TopicModel = {
      id: 'demo',
      name: 'General Knowledge'
    };

    const demoCards: FlashcardModel[] = [
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'What is the capital of France?',
        back: 'Paris',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'What planet is known as the Red Planet?',
        back: 'Mars',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'Which country has this flag?',
        back: 'Japan',
        imageUrl: base64FlagImage,
        imageBack: false,
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'What animal makes this sound?',
        back: 'Cow',
        audioUrl: base64CowAudio,
        audioBack: false
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'Who wrote "Romeo and Juliet"?',
        back: 'William Shakespeare',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'How many continents are there?',
        back: 'Seven',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'Which element has the chemical symbol O?',
        back: 'Oxygen',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'What is the largest mammal?',
        back: 'Blue whale',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'What is the square root of 64?',
        back: '8',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'Which ocean is the deepest?',
        back: 'Pacific Ocean',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'In which year did World War II end?',
        back: '1945',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'What is the smallest prime number?',
        back: '2',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'What is the hardest natural substance?',
        back: 'Diamond',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'Which language has the most native speakers?',
        back: 'Mandarin Chinese',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'How many legs does a spider have?',
        back: '8',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'Which gas do plants absorb from the atmosphere?',
        back: 'Carbon dioxide',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'What is the main ingredient in guacamole?',
        back: 'Avocado',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'What is the tallest mountain in the world?',
        back: 'Mount Everest',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'How many teeth does an adult human typically have?',
        back: '32',
      },
      {
        id: this.generateId(),
        topicId: 'demo',
        front: 'What color do you get when you mix red and blue?',
        back: 'Purple',
      },
    ];

    // Add more cards if you want to reach 20
    while (demoCards.length < 20) {
      demoCards.push({
        id: this.generateId(),
        topicId: 'demo',
        front: `Sample Question ${demoCards.length + 1}`,
        back: `Sample Answer ${demoCards.length + 1}`,
      });
    }

    this.flashcardService.saveFlashcardsAndTopics([demoTopic],demoCards);
    location.reload(); // Refresh to reflect changes
  }

  private generateId(): string {
    return '_' + Math.random().toString(36).substr(2, 9);
  }
}

interface ExportData {
  topics: TopicModel[];
  cards: FlashcardModel[];
}
