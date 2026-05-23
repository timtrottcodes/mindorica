import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: Error): void {
    console.error('Global error caught:', error);

    const errorMessage = this.getUserFriendlyMessage(error);
    
    if (this.shouldShowToUser(error)) {
      alert(`An error occurred: ${errorMessage}\n\nPlease refresh the page if the problem persists.`);
    }
  }

  private getUserFriendlyMessage(error: Error): string {
    if (error.message.includes('IndexedDB')) {
      return 'There was a problem accessing the database. Your browser storage may be full.';
    }
    
    if (error.message.includes('Network')) {
      return 'Network connection problem. Please check your internet connection.';
    }
    
    if (error.message.includes('JSON')) {
      return 'Invalid data format detected.';
    }

    return 'An unexpected error occurred';
  }

  private shouldShowToUser(error: Error): boolean {
    if (error.message.includes('ExpressionChangedAfterItHasBeenCheckedError')) {
      return false;
    }
    
    return true;
  }
}
