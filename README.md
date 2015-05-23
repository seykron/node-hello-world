node-hello-world
================

Project structure for a webapp. It includes:

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

It follows the one-component-per-file convention. Components files has CamelCase
names, with an upper-case first letter. All multi-components files like
controllers should be given camelCase names with a lower-case first letter.

### Directories

**lib/**: technical layer components.

**app/**: the web application goes here.

**app/domain/**: the domain layer. The domain includes the model and
repositories.

**app/controllers/**: the application layer goes here. There must be a single
file by each controller, despite how many routes it handles. Each controller
must handle a single resource.

**app/helpers/**: view helpers, like handlebars helpers.

**app/views/**: view files goes here. Views must have ```.html``` extension and
they are rendered with handlebars.

**app/views/**: view files goes here.

**app/views/partials/**: partials are reusable components. They must have
```.html``` extension and they can be included in views by using the following
handlebars directive: ```{{> "partialName" }}``` which is mapped to
```app/views/partials/partialName.html```

**app/views/layouts/**: layouts can be applied by request. By default,
handlebars is configured with the ```main.html``` layout, but it can be changed
setting the ```layout``` property in the response model.
