# Swear Jar


## Getting Started

These instructions will get you a copy of the project up and running on your local machine.

### Prerequisities

If you haven't yet, you'll need to [install node and npm](https://nodejs.org/en/download/). Then you'll need to install gulp. If you haven't already, enter from terminal (skip this if you do have gulp installed):

```sh
$ npm install --global gulp
```

Finally, `cd` into the project folder and do:

```sh
$ npm install
```

### Installing

With npm and gulp installed, you're good to go. To compile the source files into `docs` run:

```sh
$ gulp
```

For development, you can compile the files and view the project in your browser as you make changes at http://localhost:3000/ by running:

```sh
$ gulp serve
```

This will serve the site using local files in the `app` directory, as well as a generated `.tmp` directory. To view the site using compiled files in the `docs` directory, you can do:

```sh
$ gulp serve:docs
```

the `docs` directory is the final directory to be compiled and deployed to production.

### Deployment

The site is hosted using GitHub Pages, which points at this repo's master branch. Simply run `gulp` to build the site and commit the changes to the `docs` folder.

## Built With

### Boilerplate
- [Web Sarter Kit](https://developers.google.com/web/tools/starter-kit/)

### SCSS Libraries
- [Bourbon](https://bourbon.io/) - Mixin library.

### JS Libraries

### Dev dependencies
- [Pug](https://pugjs.org/) - Node templating library.

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D


## Authors

The list of [contributors](https://github.com/jjandoc/debate-bingo/contributors) who participated in this project.

## License

This project is licensed under the GNU License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments
