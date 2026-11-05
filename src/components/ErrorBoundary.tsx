import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

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
    console.error('Uncaught error in AgentCraft:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] p-6 text-[var(--ink)]">
          <div className="w-full max-w-md border-t border-[var(--hairline)] pt-8 text-center">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--vermilion-text)]">
              RENDER ERROR
            </p>
            <h2 className="mt-4 text-2xl font-semibold">页面遇到渲染异常</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--graphite)]">
              你的本地提交记录仍保存在浏览器中。重新加载展馆即可继续浏览。
            </p>

            {this.state.error && (
              <pre className="mt-6 overflow-x-auto rounded-[3px] border border-[var(--hairline)] bg-[var(--paper-raised)] p-4 text-left font-mono text-xs leading-6 text-[var(--graphite)]">
                {this.state.error.message}
              </pre>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-primary inline-flex"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>重新加载展馆</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('agent_craft_creations_v2_30projects');
                  } catch {
                    // Ignore
                  }
                  window.location.reload();
                }}
                className="btn-secondary inline-flex text-xs"
              >
                <span>恢复预设重试</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
