node-hello-world
================

## Table of Contents

  * [Quick start](#quick-start)
  * [Summary](#summary)
  * [Libraries](#libraries)
  * [Application structure](#application-structure)
    * [Directories](#directories)
    * [Initialization](#initialization)
    * [Controllers](#controllers)
  * [Data Source](#data-source)

## Quick start

1. Clone the repository

2. Run ```npm install```

3. Start the application: ```node index.js```

## Summary

Basic project structure for a web application. It includes:

* Application structure

* Configuration management with Grunt (lint, package, deploy, frontend
dependencies)

* Configuration files for different environments

* Data source configuration and initialization

## Libraries

ExpressJS: handle requests

Handlebars: rendering engine

Frontend libraries: jquery, bootstrap, es5-shim, font-awesome

## Application structure

[Domain Driven Design](https://en.wikipedia.org/wiki/Domain-driven_design) is
the design principle behind the application structure.

It follows the one-component-per-file convention. Components files have CamelCase
names, with an upper-case first letter. All multi-components files like
controllers should be given camelCase names with a lower-case first letter.

The application runs wrapped within a [Node's domain](https://github.com/brianc
/node-domain-middleware), so JavaScript errors will not crash the Node's
process.

### Directories

```
node-hello-world
|
|---app
    |---domain
    |---controllers
    |---views
        |---layouts
        |---partials
    |---helpers
    |---assets
        |---vendor
|---lib
|---support
|---config
```

**app/**: the web application goes here.

**app/domain/**: the domain layer. The domain includes the model and
repositories.

**app/controllers/**: the application layer goes here. There must be a single
file by each controller, despite how many routes it handles. Each controller
must handle a single resource.

**app/views/**: view files goes here. Views must have ```.html``` extension and
they are rendered with handlebars.

**app/views/**: view files goes here. They must be HTML files with handlebars
directives.

**app/views/partials/**: partials are reusable components. They must have
```.html``` extension and they can be included in views by using the following
handlebars directive: ```{{> "partialName" }}``` which is mapped to ```app/views
/partials/partialName.html```

**app/views/layouts/**: layouts can be applied by request. By default,
handlebars is configured with the ```main.html``` layout, but it can be changed
setting the ```layout``` property in the response model.

**app/helpers/**: view helpers, like handlebars helpers.

**lib/**: technical layer components.

**support/**: support files like scripts and MySQL data files.

**config/**: global configuration files. It uses and follows the conventions
from [node-config](https://github.com/lorenwest/node-config/wiki/Configuration-
Files).

### Initialization

The ```index.js``` at the root directory is the application entry point. It uses
an ```AppContext``` to initialize the application.

The ```AppContext``` receives the global configuration and performs the
following actions at ```load()```:

1. If there's a configured data source, initializes it.

2. Initializes ```lib/contextMiddleware``` to expose the context information to
the view model, and it also loads the ```lib/transactionMiddleware``` to bind a
transaction to a request if there's a defined data source.

3. Loads all controllers and returns

### Controllers

Controllers are loaded from ```app/controllers/``` and they receive the ```App
Context``` as parameter. The ```AppContext``` provides access to the domain
layer and the Express.js application.

A controller is expected to handle a single resource. It must register all
routes related to the same resource.

The domain layer is stateless, so repositories and related objects must be
created on each request.

If there's a configured data source, the Express.js request object will have
an additional ```db``` attribute which references a connection object ready
to operate against the database within a transaction.

You MUST NEVER operate with the data source in controllers, any operation must
be delegated to a domain repository.

## Data Source

This project has built-in integration with MySQL. If you don't want to use a
MySQL data source, just remove the ```dataSource``` attribute from the default
configuration file ```config/default.json```.

If you plan to use MySQL as your data source, first create the test database:

```
create database hello_world;

grant all privileges on hello_world.* to 'hello_world'@'localhost'
identified by 'hello_world';

flush privileges;
```

The ```drop``` attribute in the data source configuration indicates whether the
database is re-created every time the application starts. This is the default
behaviour.

In order to re-create and initialize the database, the application reads
MySQL data files from ```support/mysql/```. The database structure is defined
in ```support/mysql/db-setup.sql```. The data files are read by priority from
the directory *support/sql/db-setup.d/*.

Data files can be either MySQL or JSON files. MySQL files are executed against
the database once the structure is created. JSON files have the following
convention:

```
{
"table": "items",
"data":[{
  "name": "Le Chuck",
  "picture_url": "http://localhost:3000/images/lechuck.png",
  "site_url": "http://localhost:3000"
}]}
```

Each element in the ```data``` array is a single registry in the table defined
by the ```table``` attribute.
