'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Bell, UserCog } from 'lucide-react';

export default function SettingsPage() {
    return (
        <AppLayout>
            <SettingsContent />
        </AppLayout>
    );
}

function SettingsContent() {
    const { user } = useAuth();
    const [notifyEmail, setNotifyEmail] = useState(true);
    const [notifyProduct, setNotifyProduct] = useState(false);
    const [twoFactor, setTwoFactor] = useState(false);
    const [defaultVisibility, setDefaultVisibility] = useState<'private' | 'shared' | 'public'>('private');

    return (
        <div className="px-8 py-10 space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">Settings</h1>
                <p className="text-base text-gray-500 max-w-2xl">
                    Configure dados pessoais, notificações e preferências de trabalho.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCog className="h-5 w-5 text-primary" />
                            Perfil
                        </CardTitle>
                        <CardDescription>Atualize nome, email e empresa.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" defaultValue={user?.full_name || ''} placeholder="Seu nome" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue={user?.email || ''} placeholder="voce@empresa.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Empresa</Label>
                            <Input id="company" placeholder="Minha empresa" />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button disabled>Salvar (em breve)</Button>
                    </CardFooter>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            Segurança
                        </CardTitle>
                        <CardDescription>Preferências de autenticação.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <p className="font-medium">Autenticação em duas etapas</p>
                                <p className="text-sm text-muted-foreground">
                                    Adicione uma camada extra de segurança para sua conta.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={twoFactor}
                                onChange={(e) => setTwoFactor(e.target.checked)}
                                className="h-4 w-4 rounded border border-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" type="password" placeholder="••••••••" disabled />
                            <p className="text-xs text-muted-foreground">A troca de senha será feita pelo provedor de identidade.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button disabled>Gerenciar</Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            Notificações
                        </CardTitle>
                        <CardDescription>Escolha como prefere ser avisado.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <ToggleRow
                            label="Receber por email"
                            description="Atualizações de processos, projetos e compartilhamentos."
                            checked={notifyEmail}
                            onChange={setNotifyEmail}
                        />
                        <ToggleRow
                            label="Novidades do produto"
                            description="Roadmap, lançamentos e convites para beta."
                            checked={notifyProduct}
                            onChange={setNotifyProduct}
                        />
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button disabled>Salvar notificações</Button>
                    </CardFooter>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Preferências de workspace</CardTitle>
                        <CardDescription>Configurações padrão para novos itens.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Visibilidade padrão de projetos pessoais</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['private', 'shared', 'public'] as const).map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setDefaultVisibility(option)}
                                        className={`rounded-lg border p-3 text-sm capitalize transition-colors ${defaultVisibility === option
                                            ? 'border-primary bg-primary/5 text-foreground'
                                            : 'border-border hover:border-primary/60 text-muted-foreground'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="folder">Pasta padrão</Label>
                            <Input id="folder" placeholder="Ex.: Drafts" />
                            <p className="text-xs text-muted-foreground">Usaremos esta pasta ao criar novos processos rapidamente.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button variant="outline" disabled>
                            Salvar preferências
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

interface ToggleRowProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 rounded border border-input"
            />
        </div>
    );
}

