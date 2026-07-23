import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin Portal Error Boundary caught an unhandled rendering error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white border border-brand-sand/70 rounded-3xl text-center shadow-sm space-y-4 my-6 select-none">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-brand-charcoal">Something went wrong rendering this view</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {this.state.error?.message || 'An unexpected rendering error occurred. Click reload to refresh the view.'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-olive hover:bg-brand-olive-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Page</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
