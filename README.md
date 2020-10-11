# WordPress theme development

This project will install WordPress and provide you with a tool kit to run a development server. Whenever you're ready, you can create an optimized build version of your theme for deployment.

This repository will *only* include the setup of the theme, no assets, or plugins. These will have to be manually added/uploaded on the live server or development environments.

> To do: include the commonly used plugins in the base.


## 1. Project structure

### 1.1 Local dev structure

The project consists of the following main files and directories.

| Location                                 | Description                                                                |
|------------------------------------------|----------------------------------------------------------------------------|
| `config.json`                            | Config file for the dev tool chain                                         |
| `wordpress/`                             | WordPress directory                                                        |
| `wordpress/wp-config.php`                | WordPress config file (database config, etc.)                              |
| `src/new-theme/`                         | Theme development directory                                                |
| `dist/new-theme/`                        | Built theme directory for distribution                                     |
| `wordpress/wp-content/themes/new-theme/` | WordPress theme location (gets written to while `npm run dev` is active) |

### 1.2 Database

For now we're going to keep the database local. Whenever we want to deploy an update, we export it from the local database and import it into the online database.

> To do: write a script to keep the database synchronised.

### 1.3 Tools

For development I recommend the following tools:

| Purpose          | Win      | Mac        |
|------------------|----------|------------|
| Code editor      | VS Code  | VS Code    |
| Database browser | HeidiSQL | Sequel Pro |
| Web design       | Figma    | Figma      |



## 2. Installation

### 2.1 Install WordPress

Run `npm run install` and wait for the WordPress installation to finish.

### 2.2 Change configuration files

Be sure to change the MySQL settings in `./wordpress/wp-config.php`.



## 3. Development

### 3.1 Environment

Run `npm run dev` to start a PHP development server.

The server watches for file changes in your source directory and automatically updates the theme in the WordPress themes directory.

Be sure to be working in `./src/new-theme/`.


### 3.2 Coding conventions

We'll be using the following conventions for development:

| Language   | Type                 | Naming convention                  | Example                 |
|------------|----------------------|------------------------------------|-------------------------|
| JavaScript | variable             | Camel case                         | `variableName`          |
| JavaScript | function             | Camel case                         | `functionName`          |
| JavaScript | class                | Pascal case                        | `ClassName`             |
| PHP        | variable             | Camel case                         | `variableName`          |
| PHP        | function             | Camel case                         | `functionName`          |
| PHP        | class                | Pascal case                        | `ClassName`             |
| SCSS       | variable             | Delimiter (dash) separated         | `$color-primary`        |
| SCSS       | variable alternative | Double delimiter  (dash) separated | `$color-primary--light` |
| SCSS       | function/mixin       | Delimiter (dash) separated         | `function-name`         |

Other rules:

1. Always write syntactically correct identifiers for readability (https://en.wikipedia.org/wiki/Naming_convention_(programming)#Readability).
1. Write comments as much as you need. Make sure to explain _why_ and _what_ your code is doing.
1. Use two spaces for indentation. A space always represent 1 character and is always rendered correctly. Never use tabs since the size of tabs are variable.
1. Use the latest (and best-fitting) features of the language you're writing in. Make use of the features of ES6 and PHP 7.
1. For class names (related to the HTML `class` attributes and selectors in SCSS), use the BEM methodology (https://en.bem.info/methodology/).
1. Work in the "develop" git branch as much as you can. Create different branches for new or variations of existing features.
1. Write git messages in the following style: https://karma-runner.github.io/5.0/dev/git-commit-msg.html.
1. ... More to come later.


## 4. Deployment

Before uploading your theme, be sure to run `npm run build` and wait till the build completely finishes.

Default build location is: `./dist/new-theme/`.
