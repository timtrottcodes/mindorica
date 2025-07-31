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
          const imageUrl = card.imageUrl && mediaAssets[card.imageUrl]
            ? mediaAssets[card.imageUrl]
            : card.imageUrl;

          const audioUrl = card.audioUrl && mediaAssets[card.audioUrl]
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

      this.flashcardService.saveFlashcardsAndTopics(this.allTopics, this.flashcards);
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
    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return 'image/jpeg';
    return 'application/octet-stream';
  }
}

interface ExportData {
  topics: TopicModel[];
  cards: FlashcardModel[];
}
