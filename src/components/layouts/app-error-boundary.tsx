'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <p className="text-sm">حدث خطأ غير متوقع. يرجى إعادة تحميل الصفحة.</p>
          <button
            className="text-sm text-primary underline-offset-4 hover:underline"
            onClick={() => window.location.reload()}
          >
            إعادة تحميل
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
