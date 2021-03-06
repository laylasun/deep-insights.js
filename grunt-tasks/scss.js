module.exports = {
  dist: {
    options: {
      sourceMap: false,
      outputStyle: 'compressed',
      includePaths: [
        'node_modules/cartoassets/src/scss'
      ]
    },
    files: [{
      expand: true,
      src: [
        'node_modules/cartoassets/src/scss/**/*.scss',
        'node_modules/perfect-scrollbar/**/main.scss',
        'node_modules/cartodb.js/themes/scss/entry.scss',
        'themes/scss/entry.scss'
      ],
      dest: '.tmp/scss',
      ext: '.css'
    }]
  }
};
