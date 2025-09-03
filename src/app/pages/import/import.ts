import { Component } from '@angular/core';
import { FlashcardModel, TopicModel } from '../../models/flashcard';
import { ActivatedRoute } from '@angular/router';
import { FlashcardService } from '../../services/flashcard';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { from } from 'rxjs';
//import initSqlJs from 'sql.js';

@Component({
  selector: 'app-import',
  imports: [CommonModule, FormsModule],
  templateUrl: './import.html',
  styleUrl: './import.scss',
})
export class Import {
  allTopics: TopicModel[] = [];
  flashcards: FlashcardModel[] = [];
  importOverride: boolean = false;
  importMessage: string | null = null;
  selectedAnkiTopicId: string | null = null;
  selectedAnkiFile: File | null = null;
  selectedFile: File | null = null;
  isZipFile = false;
  

  constructor(
    private route: ActivatedRoute,
    private flashcardService: FlashcardService
  ) {}

  ngOnInit(): void {
    // Topics
    from(this.flashcardService.getTopics()).subscribe((topics) => {
      this.allTopics = topics;
    });

    // Flashcards
    from(this.flashcardService.getFlashcards()).subscribe((cards) => {
      this.flashcards = cards;
    });
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
    this.success("Flashcards exported");
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
      this.success("Import successful");
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
    const base64FlagImage =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAABkCAMAAABThTnCAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABhQTFRF+vr6swAF5J+m0Vho9NjbxSk+vgAm////21s6JAAAAcxJREFUeNrs2tFuwyAMBVBjG/L/fzxIV6nSthRfAvFS81T1oTqySUpyTeRzbS6XU1ewghWsYAUrWMEKVrD+CYu0LvLEUhbJZV9ZhNUDq5pKqmtXpX3lcdkgS+Upeln1K+ELWZx/mp6yzBexSP5CfcP0ChaXA9QDxutZh6V6uoQWs+QtaoehjcRYlLtUrWC6jtWtgl0QS7pVrY+rWBYV6AJYbFJVl6xgUTGyCrC97CyxqpA2mllqVlUXT2cJwsqzWUixgHJZWYKx8lwWQSp7uYwsRlkylZVBVik0kUUoytpFG4vhYhm7aGMJzsqfx8oDLJrGwne89VJcx9JpLPXJimrdYMs7vUHEXf4Of9WaXB5snB4D8UOz8RnDyFKfjxhgF5Oxh3d5fIXKZS6WncU+X42QvVz2YgHvt+y7C4gNbvOS0vxKt9AalulqhFQYS5PLuKAe6rvDFSwlA6Mo7esjnN2hCRn17Hs86cRjzreB4kCcOBIKaz6EpTKQVg9F6HIQoQ+UapS1Ucv206+5/tgoxPB4BreSvdDaZ+HRXz1hmIX2WZbHwEgbZzljmuWk0R9SVmY+bfgn5reCFaxgBStYwQpWsD6TtTmtlsv1JcAAqJJ+vxE2oAIAAAAASUVORK5CYII=';
    const base64CowAudio =
      'data:audio/mpeg;base64,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';
    const base64Avocado =
      'data:image/jpeg;base64,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';
    const base64Tomato =
      'data:image/jpeg;base64,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';
    const base64Bread =
      'data:image/jpeg;base64,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';
    const base64Hallo = 
      'data:audio/mpeg;base64,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'

    const demoGNTopic: TopicModel = {
      id: 'general-knowledge',
      name: 'General Knowledge',
    };
    const demoDETopic: TopicModel = {
      id: 'german-basics',
      name: 'German Basics',
    };

    const demoCards: FlashcardModel[] = [
      {
        id: this.generateId(),
        topicId: 'general-knowledge',
        front: 'What is the capital of France?',
        back: 'Paris',
        options: [
          {
            id: this.generateId(),
            front: 'What is the capital of France?',
            back: 'London',
            topicId: 'general-knowledge',
            options: [],
          },
          {
            id: this.generateId(),
            front: 'What is the capital of France?',
            back: 'Berlin',
            topicId: 'general-knowledge',
            options: [],
          },
        ],
      },
      {
        id: this.generateId(),
        topicId: 'general-knowledge',
        front: 'What planet is known as the Red Planet?',
        back: 'Mars',
        options: [
          {
            id: this.generateId(),
            front: 'What planet is known as the Red Planet?',
            back: 'Jupiter',
            topicId: 'general-knowledge',
            options: [],
          },
          {
            id: this.generateId(),
            front: 'What planet is known as the Red Planet?',
            back: 'Venus',
            topicId: 'general-knowledge',
            options: [],
          },
        ],
      },
      {
        id: this.generateId(),
        topicId: 'general-knowledge',
        front: 'Which country has this flag?',
        back: 'Japan',
        imageUrl: base64FlagImage,
        imageBack: false,
        options: [
          {
            id: this.generateId(),
            front: 'Which country has this flag?',
            back: 'South Korea',
            topicId: 'general-knowledge',
            options: [],
          },
          {
            id: this.generateId(),
            front: 'Which country has this flag?',
            back: 'China',
            topicId: 'general-knowledge',
            options: [],
          },
        ],
      },
      {
        id: this.generateId(),
        topicId: 'general-knowledge',
        front: 'What animal makes this sound?',
        back: 'Cow',
        audioUrl: base64CowAudio,
        audioBack: false,
        options: [
          {
            id: this.generateId(),
            front: 'What animal makes this sound?',
            back: 'Sheep',
            topicId: 'general-knowledge',
            options: [],
          },
          {
            id: this.generateId(),
            front: 'What animal makes this sound?',
            back: 'Horse',
            topicId: 'general-knowledge',
            options: [],
          },
        ],
      },
      {
        id: this.generateId(),
        topicId: 'general-knowledge',
        front: 'Who wrote "Romeo and Juliet"?',
        back: 'William Shakespeare',
        options: [
          {
            id: this.generateId(),
            front: 'Who wrote "Romeo and Juliet"?',
            back: 'Charles Dickens',
            topicId: 'general-knowledge',
            options: [],
          },
          {
            id: this.generateId(),
            front: 'Who wrote "Romeo and Juliet"?',
            back: 'Jane Austen',
            topicId: 'general-knowledge',
            options: [],
          },
        ],
      },
      {
        id: this.generateId(),
        topicId: 'general-knowledge',
        front: 'What is the main ingredient in guacamole?',
        back: 'Avocado',
        imageUrl: base64Avocado,
        imageBack: true,
        options: [
          {
            id: this.generateId(),
            front: 'What is the main ingredient in guacamole?',
            back: 'Tomato',
            imageUrl: base64Tomato,
            imageBack: true,
            topicId: 'general-knowledge',
            options: [],
          },
          {
            id: this.generateId(),
            front: 'What is the main ingredient in guacamole?',
            back: 'Bread',
            imageUrl: base64Bread,
            imageBack: true,
            topicId: 'general-knowledge',
            options: [],
          },
        ],
      },
      {
        id: this.generateId(),
        topicId: 'german-basics',
        front: 'How do you say "Hello, How are you?" in German?',
        back: 'Hallo, wie geht es dir?',
        audioUrl: base64Hallo,
        audioBack: true,
        options: [],
      },
      {
        id: this.generateId(),
        topicId: 'german-basics',
        front: 'What does "Danke" mean?',
        back: 'Thank you',
        options: [],
      },
      {
        id: this.generateId(),
        topicId: 'german-basics',
        front: 'What color is "Blau" in English?',
        back: 'Blue',
        options: [],
      },
      {
        id: this.generateId(),
        topicId: 'german-basics',
        front: 'How do you say "One" in German?',
        back: 'Eins',
        options: [],
      },
      {
        id: this.generateId(),
        topicId: 'german-basics',
        front: 'What is the German word for "cat"?',
        back: 'Katze',
        options: [],
      },
      {
        id: this.generateId(),
        topicId: 'german-basics',
        front: 'How do you say "Goodbye" in German?',
        back: 'Auf Wiedersehen',
        options: [],
      },
    ];

    // Add more cards if you want to reach 20
    while (demoCards.length < 20) {
      demoCards.push({
        id: this.generateId(),
        topicId: 'demo',
        front: `Sample Question ${demoCards.length + 1}`,
        back: `Sample Answer ${demoCards.length + 1}`,
        options: [],
      });
    }

    this.flashcardService.saveFlashcardsAndTopics(
      [demoGNTopic, demoDETopic],
      demoCards
    );
    location.reload(); // Refresh to reflect changes
  }

  onAnkiFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedAnkiFile = input.files[0];
    }
  }

  onAnkiImportSubmit(event: Event): void {
      event.preventDefault(); // Prevent form reload

      if (!this.selectedAnkiFile || !this.selectedAnkiTopicId) {
        alert('Please select both a file and a topic.');
        return;
      }

      // Call your import method
      //this.importAnkiFile(this.selectedAnkiFile, this.selectedAnkiTopicId);
    }

  /*async importAnkiFile(file: File, topicId: string): Promise<void> {
    const zip = await JSZip.loadAsync(file);
    const dbFile = zip.file('collection.anki21') ?? zip.file('collection.anki2');

    if (!dbFile) {
      alert('Invalid Anki file: no collection.anki21 or .anki2 found.');
      return;
    }

    const dbArrayBuffer = await dbFile.async('arraybuffer');
    const SQL = await initSqlJs({ locateFile: () => 'assets/sql-wasm.wasm' });
    const db = new SQL.Database(new Uint8Array(dbArrayBuffer));

    const result = db.exec(`SELECT flds FROM notes`);
    if (!result.length) {
      alert('No notes found in Anki deck.');
      return;
    }

    // Build media map (id -> filename) and reverse it
    const mediaFile = zip.file('media');
    const mediaRaw = mediaFile ? await mediaFile.async('string') : '{}';
    const mediaMap = JSON.parse(mediaRaw) as Record<string, string>;

    // Convert to filename -> index for easy lookup
    const filenameToIndex: Record<string, string> = {};
    for (const [index, filename] of Object.entries(mediaMap)) {
      filenameToIndex[filename] = index;
    }

    // Load binary media files
    const mediaFiles: Record<string, Uint8Array> = {};
    for (const [index, filename] of Object.entries(mediaMap)) {
      const file = zip.file(index);
      if (file) {
        mediaFiles[filename] = new Uint8Array(await file.async('uint8array'));
      }
    }

    const rows = result[0].values.map(r => r[0] as string);
    const cards = this.extractNotes(rows, mediaFiles, mediaMap);

    for (const card of cards) {
      card.topicId = topicId;
      this.flashcards.push(card);
    }

    this.flashcardService.saveFlashcardsAndTopics(this.allTopics, this.flashcards);
    const topic = this.allTopics.find(t => t.id === topicId);
    this.success(`${cards.length} card(s) imported to topic “${topic?.name}”.`);
  }*/


  success(msg: string) {
    this.importMessage = msg;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => this.importMessage = null, 5000);
  }

  extractNotes(fldsRows: string[], mediaFiles: Record<string, Uint8Array>, mediaMap: Record<string, string>) {
    const fieldSeparator = '\x1f';
    const cards: FlashcardModel[] = [];

    for (const flds of fldsRows) {
      const fields = flds.split(fieldSeparator);
      const rawFront = fields[0] ?? '';
      const rawBack = fields[1] ?? '';
      const notesRaw = fields.slice(2).filter(Boolean).join('\n');

      const mediaInfo = {
        audioUrl: '',
        audioBack: false,
        imageUrl: '',
        imageBack: false,
      };

      const front = this.stripAndExtractMedia(rawFront, mediaFiles, mediaMap, mediaInfo, false);
      const back = this.stripAndExtractMedia(rawBack, mediaFiles, mediaMap, mediaInfo, true);
      const notes = this.stripAndExtractMedia(notesRaw, mediaFiles, mediaMap, mediaInfo, false);

      const card: FlashcardModel = {
        id: crypto.randomUUID(),
        topicId: '', // set later
        front,
        back,
        notes,
        options: [],
        ...mediaInfo
      };

      cards.push(card);
    }

    console.log(cards);
    return cards;
  }

  stripAndExtractMedia(
    text: string,
    mediaFiles: Record<string, Uint8Array>,
    mediaMap: Record<string, string>,
    mediaInfo: { audioUrl: string, audioBack: boolean, imageUrl: string, imageBack: boolean },
    isBack: boolean
  ): string {
    return text
      .replace(/\[sound:(.+?)\]/g, (_, filename) => {
        const mediaKey = Object.keys(mediaMap).find(k => mediaMap[k] === filename);
        const file = mediaKey ? mediaFiles[mediaMap[mediaKey]] : undefined;
        if (file && !mediaInfo.audioUrl) {
          const b64 = this.toBase64(file);
          mediaInfo.audioUrl = `data:audio/mpeg;base64,${b64}`;
          mediaInfo.audioBack ||= isBack;
        }
        return '';
      })
      .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/g, (_, filename) => {
        const mediaKey = Object.keys(mediaMap).find(k => mediaMap[k] === filename);
        const file = mediaKey ? mediaFiles[mediaMap[mediaKey]] : undefined;
        if (file && !mediaInfo.imageUrl) {
          const b64 = this.toBase64(file);
          mediaInfo.imageUrl = `data:image/jpeg;base64,${b64}`;
          mediaInfo.imageBack ||= isBack;
        }
        return '';
      })
      .replace(/^(<br\s*\/?>)+/, '') // trim leading <br>
      .trim();
  }

  toBase64(file: Uint8Array): string {
    return btoa(String.fromCharCode(...file));
  }

  importToMindorica(notes: any[]) {
    for (const note of notes) {
      const card = {
        front: note.front,
        back: note.back,
        notes: note.note,
        options: [] // Optional: add support for extracting options
      };

      this.flashcardService.addFlashcard(card); // your internal service
    }
  }

  private generateId(): string {
    return '_' + Math.random().toString(36).substr(2, 9);
  }
}

interface ExportData {
  topics: TopicModel[];
  cards: FlashcardModel[];
}
