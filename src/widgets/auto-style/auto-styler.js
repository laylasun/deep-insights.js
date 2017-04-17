var cdb = require('cartodb.js');
var CategoryColors = require('./category-colors');
var AutoStyler = cdb.core.Model.extend({
  initialize: function (dataviewModel, options) {
    this.options = options || {};
    this.styles = options && options.auto_style;
    this.dataviewModel = dataviewModel;
    this.colors = new CategoryColors(this.styles);
    this.layer = this.dataviewModel.layer;
    this.STYLE_TEMPLATE = this.options.basemap === 'DARK' ? AutoStyler.STYLE_TEMPLATE_DARK : AutoStyler.STYLE_TEMPLATE_LIGHT;
  },

  _getLayerHeader: function (symbol) {
    var type = '[mapnik-geometry-type=' + AutoStyler.MAPNIK_MAPPING[symbol] + ']';

    if (symbol === 'line') {
      type.substring(0, type.length - 1);
      type += ' || mapnik-geometry-type=' + AutoStyler.MAPNIK_MAPPING['polygon'] + ']';
    }

    return '#layer [mapnik-geometry-type=' + type + ']{';
  },

  getPreservedWidth: function () {
    var originalWidth;
    var startingStyle = this.layer.get && (this.layer.get('cartocss') || this.layer.get('meta').cartocss);
    if (startingStyle) {
      originalWidth = startingStyle.match(/marker-width:.*?;\s/g);
      if (originalWidth) {
        if (originalWidth.length > 1) {
          var variableWidths = startingStyle.match(/\[.*?[><=].*?].*?{\s*?marker\-width\:\s*?\d.*?;\s*?}/g).join('\n');
          return {
            ramp: variableWidths,
            fixed: originalWidth[0].trim().replace('marker-width:', '').replace(';', '')
          };
        } else {
          originalWidth = originalWidth[0].trim().replace('marker-width:', '').replace(';', '');
        }
      }
    }
    return originalWidth;
  }

});

// for Light Basemap
AutoStyler.STYLE_TEMPLATE_LIGHT = {
  polygon: ['{{layername}}',
          '  polygon-fill: {{defaultColor}};',
          '  polygon-opacity: 0.9;  ',
          '  polygon-gamma: 0.5;    ',
          '  line-color: #fff;',
          '  line-width: 0.25;',
          '  line-opacity: 0.25;',
          '  line-comp-op: hard-light;',
          '  {{ramp}}',
          '}'].join('\n'),
  marker: ['{{layername}}',
         '  marker-width: {{markerWidth}};',
         '  marker-fill-opacity: 0.9;  ',
         '  marker-fill: {{defaultColor}};  ',
         '  marker-line-color: #fff;',
         '  marker-allow-overlap: true;',
         '  marker-line-width: 1;',
         '  marker-line-opacity: 0.8;',
         '  {{ramp}}',
         '  {{wramp}}',
         '}'].join('\n'),
  line: ['{{layername}}',
          '  line-color: {{defaultColor}};',
          '  line-width: 0.3;',
          '  line-opacity: 0.3;',
          '  {{ramp}}',
          '}'].join('\n')
};

// for Dark Basemap
AutoStyler.STYLE_TEMPLATE_DARK = {
  polygon: ['{{layername}}',
          '  polygon-fill: {{defaultColor}};',
          '  polygon-opacity: 0.9;  ',
          '  polygon-gamma: 0.5;    ',
          '  line-color: #fff;',
          '  line-width: 0.25;',
          '  line-opacity: 0.25;',
          '  line-comp-op: hard-light;',
          '  {{ramp}}',
          '}'].join('\n'),
  marker: ['{{layername}}',
        '  marker-width: {{markerWidth}};',
        '  marker-fill-opacity: 0.9;  ',
        '  marker-fill: {{defaultColor}};  ',
        '  marker-line-color: #000;',
        '  marker-allow-overlap: true;',
        '  marker-line-width: 1;',
        '  marker-line-opacity: 0.5;',
        '  {{ramp}}',
        '  {{wramp}}',
         '}'].join('\n'),
  line: ['{{layername}}',
          '  line-color: {{defaultColor}};',
          '  line-width: 0.3;',
          '  line-opacity: 0.3;',
          '  {{ramp}}',
          '}'].join('\n')
};

AutoStyler.MAPNIK_MAPPING = {
  polygon: 3,
  marker: 1,
  line: 2
};

module.exports = AutoStyler;
