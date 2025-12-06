'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Sparkles } from 'lucide-react';

export default function AnalyticsPage() {
    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="px-8 py-10 space-y-6">
                    <div className="flex items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">Analytics</h1>
                            <p className="text-base text-gray-500 max-w-2xl">
                                Área reservada para métricas e insights. Em breve você verá gráficos sobre uso, qualidade e colaboração.
                            </p>
                        </div>
                        <Button variant="outline" disabled className="gap-2">
                            <Sparkles className="h-4 w-4" />
                            Sugerir métrica
                        </Button>
                    </div>

                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LineChart className="h-5 w-5 text-primary" />
                                Em breve
                            </CardTitle>
                            <CardDescription>
                                Estamos definindo os indicadores que mais ajudam times de processos. Deixe seu feedback pelo botão acima.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {['Eficiência de modelagem', 'Adoção do estúdio', 'Qualidade das versões', 'Colaboração', 'Cobertura de pastas', 'Governança'].map((item) => (
                                <div
                                    key={item}
                                    className="p-4 rounded-lg border bg-muted/30 text-sm text-muted-foreground flex items-center justify-between"
                                >
                                    <span>{item}</span>
                                    <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">em breve</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}

