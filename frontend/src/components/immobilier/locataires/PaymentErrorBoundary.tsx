import { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface PaymentErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class PaymentErrorBoundary extends Component<PaymentErrorBoundaryProps, PaymentErrorBoundaryState> {
  constructor(props: PaymentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PaymentErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Payment component error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6 text-center">
            <div className="text-red-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Erreur de chargement</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Une erreur s'est produite lors du chargement des données de paiement.
              </p>
              <Button 
                variant="outline" 
                onClick={this.handleRetry}
                className="rounded-xl"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}