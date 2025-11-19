'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Puzzle, Download, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';

interface LibraryPlugin {
	name: string;
	version: string;
	displayName?: string;
	description?: string;
	author?: string;
	source: 'npm' | 'git' | 'local';
	path: string;
	icon?: string;
	permissions?: string[];
	isSigned?: boolean;
	signedBy?: string;
}

export function PluginLibrary() {
	const [items, setItems] = useState<LibraryPlugin[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [installing, setInstalling] = useState<string | null>(null);

	useEffect(() => {
		loadLibrary();
	}, []);

	const loadLibrary = async () => {
		setIsLoading(true);
		try {
			const data = await api.getPluginLibrary();
			const plugins = Array.isArray(data?.plugins) ? (data.plugins as LibraryPlugin[]) : [];
			setItems(plugins);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load plugin library');
		} finally {
			setIsLoading(false);
		}
	};

	const handleInstall = async (plugin: LibraryPlugin) => {
		try {
			setInstalling(plugin.name);
			await api.installPlugin({
				scope: 'user', // Default to user install from app UI
				name: plugin.name,
				version: plugin.version,
				source: plugin.source,
				path: plugin.path,
				displayName: plugin.displayName,
				description: plugin.description,
				author: plugin.author,
				permissions: plugin.permissions || [],
			});

			toast.success(`Installed ${plugin.displayName || plugin.name}`);
		} catch (err: any) {
			console.error(err);
			toast.error(err?.message || 'Failed to install plugin');
		} finally {
			setInstalling(null);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-xl font-semibold flex items-center gap-2">
						<Puzzle className="h-5 w-5" />
						Plugin Library
					</h3>
					<p className="text-sm text-muted-foreground">
						Browse and install plugins from the OpenStrand community registry
					</p>
				</div>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			) : items.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
						<div className="rounded-full bg-muted p-4">
							<Puzzle className="h-8 w-8 text-muted-foreground" />
						</div>
						<div className="text-center space-y-1">
							<p className="font-medium">No plugins found</p>
							<p className="text-sm text-muted-foreground">
								The library is empty or unavailable.
							</p>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{items.map((item) => (
						<Card key={item.name}>
							<CardHeader>
								<div className="flex items-start justify-between gap-4">
									<div className="space-y-1">
										<CardTitle className="text-base flex items-center gap-2">
											{item.displayName || item.name}
											<Badge variant="outline" className="text-xs">v{item.version}</Badge>
										</CardTitle>
										{item.description && (
											<CardDescription>{item.description}</CardDescription>
										)}
										<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
											{item.author && <span>by {item.author}</span>}
											<Badge variant="outline" className="text-xs">{item.source}</Badge>
										</div>
										{Array.isArray(item.permissions) && item.permissions.length > 0 && (
											<div className="flex flex-wrap gap-1 pt-1">
												{item.permissions.map((perm) => (
													<Badge key={perm} variant="secondary" className="text-xs">
														{perm}
													</Badge>
												))}
											</div>
										)}
										<div className="pt-1">
											{item.isSigned ? (
												<Badge variant="secondary" className="text-xs gap-1">
													<ShieldCheck className="h-3 w-3" />
													Verified{item.signedBy ? ` by ${item.signedBy}` : ''}
												</Badge>
											) : (
												<Badge variant="outline" className="text-xs gap-1">
													<ShieldAlert className="h-3 w-3" />
													Unsigned
												</Badge>
											)}
										</div>
									</div>
									<div>
										<Button
											size="sm"
											onClick={() => handleInstall(item)}
											disabled={installing === item.name}
										>
											{installing === item.name ? (
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											) : (
												<Download className="h-4 w-4 mr-2" />
											)}
											Install
										</Button>
									</div>
								</div>
							</CardHeader>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}


