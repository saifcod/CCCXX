import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BRAND_CONFIG } from '../data/products';
import { RefreshCw, MessageCircle, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by CORELUX ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl border border-[#E8E2D5] p-6 sm:p-8 text-center shadow-lg space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#FAF5EA] border border-[#E8DFC8] flex items-center justify-center mx-auto text-[#8C6D2D]">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1C2024] font-display">
                Something went wrong
              </h1>
              <p className="text-xs sm:text-sm text-[#5D646D] leading-relaxed">
                An unexpected display issue occurred. Your cart and orders remain secure. Please refresh to continue shopping.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full min-h-[46px] px-4 py-2.5 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs sm:text-sm font-semibold rounded-md flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-[#C5A059]" />
                <span>Reload Storefront</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full min-h-[42px] px-4 py-2 bg-white hover:bg-[#FAF8F5] text-[#1C2024] border border-[#D5CDC0] text-xs font-semibold rounded-md transition-colors"
              >
                <span>Go to Homepage</span>
              </button>

              <a
                href={BRAND_CONFIG.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[42px] px-4 py-2 bg-[#EAF5EF] hover:bg-[#DDF0E4] text-[#143D2B] border border-[#BDE8C9] text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors block text-center"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366] inline" />
                <span>Need immediate help? Contact on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
