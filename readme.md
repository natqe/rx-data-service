# Rx data service

<!-- ## Zero Boilerplate

[_NgRx_](https://github.com/ngrx/platform/blob/master/README.md) helps Angular applications manage shared state in a "reactive" style, following the [redux](https://redux.js.org) pattern.

But to use it properly requires _both_ a deep understanding of redux/ngrx _and_ a lot of _boilerplate code_.

_Ngrx-data_ is an _ngrx_ extension that offers a gentle introduction to _ngrx/redux_ without the boilerplate.

> **Try it!** See the [Quick Start](https://github.com/johnpapa/ngrx-data-lab/blob/master/README.md) for instructions on adding NgRx and ngrx-data to your app.

<a id="why"></a> -->

<!-- ## Why use _ngrx-data_?

Many applications have substantial _domain models_ with 10s or 100s of [entity types](docs/faq.md/#entity)
such as _Customer_, _Order_, _LineItem_, _Product_, and _User_.

In plain _ngrx_, to create, retrieve, update, and delete (CRUD) data for every entity type is an overwhelming task. You're writing _actions_, _action-creators_, _reducers_, _effects_, _dispatchers_, and _selectors_ as well as the HTTP GET, PUT, POST, and DELETE methods _for each entity type_.

In even a small model, this is a ton of repetitive code to create, maintain, and test.

The _ngrx-data_ library is _one_ way to stay on the _ngrx_ path while radically reducing the "boilerplate" necessary to manage entities with _ngrx_. -->

<!-- ## It's still _NgRx_

**This is a _library for ngrx_, not an ngrx alternative.**

It's easy to combine standard ngrx with ngrx-data.
It's easy to take control when you need it and hand control back to ngrx-data when you're done.

Every entity has its own actions. Every operation takes its unique journey through the store, reducers, effects, and selectors. You just let _ngrx-data_ create these for you.

You can add custom store properties, actions, reducers, selectors, and effects. You can override any ngrx-data behavior for an individual entity type or for all entities.
You can make your own calls to the server and update the cached entity collections with the results using ngrx-data _cache-only_ actions.

You can see the _ngrx machinery_ at work with the [_redux developer tools_](#redux-dev-tools). You can listen to the flow of actions directly. You can _intercept and override anything_ ... but you only have to intervene where you want to add custom logic. -->
<!--
### Learn about it

For a hands-on experience, try the [QuickStart](https://github.com/johnpapa/ngrx-data-lab/blob/master/README.md)
in the tutorial git repo, **[ngrx-data-lab](https://github.com/johnpapa/ngrx-data-lab/)**,
which guides you on the few, simple steps necessary to migrate from a typical service-based Angular app, to an app that manages state with _ngrx-data_.

_This_ **ngrx-data repository** has the main documentation and its own sample app.

The sample app in the `src/client/app/` folder presents an editor for viewing and changing _Heroes_ and _Villains_.

The following _reduced_ extract from that demo illustrates the essential mechanics of configuring and using _ngrx-data_.

You begin with a description of the entity model in a few lines of metadata.

```javascript
// Metadata for the entity model
export const entityMetadata: EntityMetadataMap = {
  Hero: {},
  Villain: {}
};

// Help ngrx-data pluralize entity type names
// because the plural of "Hero" is not "Heros"
export const pluralNames = {
  Hero: 'Heroes' // the plural of Hero
};
```

You register the metadata and plurals with the `ngrx-data` module.

```javascript
@NgModule({
  imports: [
    NgrxDataModule.forRoot({
      entityMetadata: entityMetadata,
      pluralNames: pluralNames
    })
  ]
})
export class EntityStoreModule {}
```

Your component accesses each entity data through an `EntityCollectionService` which you can acquire from the _ngrx_data_ `EntityServices`.

In the following example,
the `HeroesComponent` injects `EntityServices` and asks it for an `EntityCollectionService`
registered under the `Hero` entity name.

The component uses that service to read and save _Hero_ entity data
in a reactive, immutable style, _without reference to any of the ngrx artifacts_.

```javascript
import { EntityCollectionService, EntityServices } from 'ngrx-data';
import { Hero } from '../../core';

@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroesComponent implements OnInit {
  heroes$: Observable<Hero[]>;
  heroesService: EntityCollectionService<Hero>;

  constructor(entityServices: EntityServices) {
    this.heroesService = entityServices.getEntityCollectionService('Hero');
    this.heroes$ = this.heroesService.entities$;
  }

  ngOnInit() {
    this.getHeroes();
  }

  getHeroes() {
    this.heroesService.getAll();
  }

  addHero(hero: Hero) {
    this.heroesService.add(hero);
  }

  deleteHero(hero: Hero) {
    this.heroesService.delete(hero.id);
  }

  updateHero(hero: Hero) {
    this.heroesService.update(hero);
  }
}
```

As you explore _ngrx-data_ and its documentation,
you'll learn many extension points and customizations that
tailor the developer experience to your application needs. -->

<!-- ## QuickStart

Try the [Quick Start](https://github.com/johnpapa/ngrx-data-lab/blob/master/README.md) to experience NgRx and ngrx-data in your app.

<a id="explore"></a> -->

<!-- ### Learn more in the docs

* [Quick Start](https://github.com/johnpapa/ngrx-data-lab/blob/master/README.md)
* [Architecture](docs/architecture.md)
* [Entity Metadata](docs/entity-metadata.md)
* [Entity Collection](docs/entity-collection.md)
* [Entity Collection Service](docs/entity-collection-service.md)
* [Entity Services](docs/entity-services.md)
* [Entity DataService](docs/entity-dataservice.md)
* [Entity Actions](docs/entity-actions.md)
* [Entity Reducer](docs/entity-reducer.md)
* [Entity Change Tracker](docs/entity-change-tracker.md)
* [Saving multiple-entities at once](docs/save-entities.md)
* [Extension Points](docs/extension-points.md)
* [Limitations](docs/limitations.md)
* [FAQ: Frequently Asked Questions](docs/faq.md)

### Install and run

The demo app is based on the Angular CLI. You may want to install the CLI globally if you have not already done so.

```bash
npm install -g @angular/cli
```

Then follow these steps:

1.  Clone this repository

    ```bash
    git clone https://github.com/johnpapa/angular-ngrx-data.git
    cd angular-ngrx-data
    ```

2.  Install the npm packages

    ```bash
    npm install
    ```

3.  Build the `ngrx-data` library

    ```bash
    npm run build-setup
    ```

4.  Serve the CLI-based demo app

    ```bash
    ng serve -o
    ```

Refer to the [troubleshooting](#installation) section if you run into installation issues.

## Run the library tests

The _ngrx-data_ library ships with unit and E2E (end-to-end) tests to validate functionality and guard against regressions.

These tests also demonstrate features of the library that are not covered in the demo app. They're worth reading to discover more advanced techniques.

Run this CLI command to execute the **unit tests** for the library.

```bash
ng test
```

Run the sample app **E2E (end-to-end) tests**.

```bash
npm run e2e
```

We welcome [PRs](https://github.com/johnpapa/angular-ngrx-data/pulls) that add to the tests as well as those that fix bugs and documentation.

Be sure to run these tests before submitting a PR for review.

<a id="redux-dev-tools"></a>

## Monitor the app with Redux DevTools

The demo app is [configured for monitoring](https://github.com/ngrx/platform/tree/master/docs/store-devtools) with the [Redux DevTools](https://github.com/zalmoxisus/redux-devtools-extension).

Follow these instructions to [install them in your browser](https://github.com/zalmoxisus/redux-devtools-extension) and learn how to use them.

## Debug the library in browser dev tools

When running _tests_, open the browser dev tools, go to the "Sources" tab, and look for the library files by name.

> In chrome, type [Command-P] and letters of the file name.

When _running the app_ (e.g., with `ng serve`), the browser dev tools give you TWO choices for a given TypeScript source file, both claiming to be from `.ts`.

The one you want for library and app files ends in `/lib/src/file-name.ts` and `/src/client/app/path/file-name.ts` respectively.

> Hope to solve the _two file_ problem.

## Build the app against the source

The demo app is setup to build and run against the ngPackagr artifacts in `dist/ngrx-data`,
the same artifacts delivered in the npm package.

> Re-build the library `npm run build-lib` or `npm run build-setup` or `npm run build-all`
> to update these artifacts.

This approach, while safe, can be inconvenient when you're evolving the library code because
"Go to definition" takes you to the `d.ts` files in `dist/ngrx-data` rather than
the source files in `lib/src`.

If you want to "Go to definition" to take you to the source files,
make the following **\*temporary changes** to the TypeScript configuration.

1.  **_Replace_** the paths target in the root `tsconfig.json` so that the IDE (e.g., VS Code) looks for `ngrx-data` in `src/lib`.

    ```bash
      "paths": {
        "ngrx-data": ["lib/src"]
      },
    ```

2.  **_Replace_** _that same setting_ in the config at `src/tsconfig.json`.

3.  **_Replace_** _that same setting_ in `src/client/tsconfig.app.json`.
    Now `ng build` references `src/lib` when it builds the demo app.

> **Remember to _restore the `tsconfig` settings_ when you're done. Do not commit those changes!**

## Use a real database

The demo app queries and saves mock entity data to an in-memory database with the help of the
[Angular In-memory Web API](https://github.com/angular/in-memory-web-api).

The "Remote Data" toggle switch in the header switches
to the remote database.

The app fails when you switch to the remote database.

> Notice how the app detects errors and pops up a toast message with the failed _ngrx_ `Action.type`.
>
> The error details are in the browser's console log.

You must first set up a database and launch a web api server that talks to it.

The `src/server` folder has code for a local node web api server, configured for the demo app.

## Problems or Suggestions

[Open an issue here](https://github.com/johnpapa/angular-ngrx-data/issues) -->