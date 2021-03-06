/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { IDisposable, dispose, Disposable } from 'vs/base/common/lifecycle';
import { Scope, Memento } from 'vs/workbench/common/memento';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { IThemeService, ITheme, ICssStyleCollector } from 'vs/platform/theme/common/themeService';

/**
 * Base class of any core/ui component in the workbench. Examples include services, extensions, parts, viewlets and quick open.
 * Provides some convinience methods to participate in the workbench lifecycle (dispose, shutdown) and
 * loading and saving settings through memento.
 */
export interface IWorkbenchComponent extends IDisposable {

	/**
	* The unique identifier of this component.
	*/
	getId(): string;

	/**
	* Called when the browser containing the container is closed.
	*
	* Use this function to store settings that you want to restore next time. Should not be used to free resources
	* because dispose() is being called for this purpose and shutdown() has a chance to be vetoed by the user.
	*/
	shutdown(): void;

	/**
	* Called when the UI component is being removed from the container. Free up resources from here.
	*/
	dispose(): void;
}

export class WorkbenchComponent extends Disposable implements IWorkbenchComponent {
	private _toUnbind: IDisposable[];
	private id: string;
	private componentMemento: Memento;
	private theme: ITheme;

	constructor(
		id: string,
		protected themeService: IThemeService
	) {
		super();

		this._toUnbind = [];
		this.id = id;
		this.componentMemento = new Memento(this.id);
		this.theme = themeService.getTheme();

		// Hook up to theme changes
		this.toUnbind.push(this.themeService.onThemeChange((theme, collector) => this.onThemeChange(theme, collector)));
	}

	protected onThemeChange(theme: ITheme, collector: ICssStyleCollector): void {
		this.theme = theme;

		this.updateStyles(theme, collector);
	}

	protected updateStyles(theme: ITheme, collector: ICssStyleCollector): void {
		// Subclasses to override
	}

	protected getColor(id: string): string {
		return this.theme.getColor(id).toString();
	}

	protected get toUnbind() {
		return this._toUnbind;
	}

	public getId(): string {
		return this.id;
	}

	/**
	* Returns a JSON Object that represents the data of this memento. The optional
	* parameter scope allows to specify the scope of the memento to load. If not
	* provided, the scope will be global, Scope.WORKSPACE can be used to
	* scope the memento to the workspace.
	*
	* Mementos are shared across components with the same id. This means that multiple components
	* with the same id will store data into the same data structure.
	*/
	protected getMemento(storageService: IStorageService, scope: Scope = Scope.GLOBAL): any {
		return this.componentMemento.getMemento(storageService, scope);
	}

	/**
	* Saves all data of the mementos that have been loaded to the local storage. This includes
	* global and workspace scope.
	*
	* Mementos are shared across components with the same id. This means that multiple components
	* with the same id will store data into the same data structure.
	*/
	protected saveMemento(): void {
		this.componentMemento.saveMemento();
	}

	public shutdown(): void {

		// Save Memento
		this.saveMemento();
	}

	public dispose(): void {
		this._toUnbind = dispose(this._toUnbind);

		super.dispose();
	}
}