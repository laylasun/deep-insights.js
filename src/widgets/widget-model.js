var _ = require('underscore');
var cdb = require('cartodb.js');
var AutoStylerFactory = require('./auto-style/factory');

/**
 * Default widget model
 *
 * Note: Currently all widgets have a dependency on a dataview, why it makes sense to have it here.
 * If you need a widget model that's backed up by a dataview model please implement your own model and adhere to the
 * public interface instead of extending/hacking this one.
 */
module.exports = cdb.core.Model.extend({
  defaults: {
    attrsNames: [],
    show_stats: false
  },

  defaultState: {
    'collapsed': false
  },

  initialize: function (attrs, models, opts) {
    opts = opts || {};
    this.dataviewModel = models.dataviewModel;
    this.defaults.autoStyleEnabled = opts.autoStyleEnabled;

    this.activeAutoStyler();
    this.bind('change:style', this.activeAutoStyler, this);
  },

  activeAutoStyler: function () {
    if (this.isAutoStyleEnabled() && !this.autoStyler) {
      this.autoStyler = AutoStylerFactory.get(this.dataviewModel, this.get('style'));
    }
  },

  /**
   * @public
   * @param {Object} attrs, not that it should be
   * @return {Boolean} true if at least one attribute was changed
   * @throws {Error} Should throw an error if the attrs are invalid or inconsistent
   */
  update: function (attrs) {
    var wAttrs = _.pick(attrs, this.get('attrsNames'));
    this.set(wAttrs);
    this.dataviewModel.update(attrs);
    this._triggerChangesInAutoStyle();
    return !!(this.changedAttributes() || this.dataviewModel.changedAttributes());
  },

  _triggerChangesInAutoStyle: function () {
    var changed = this.changed && this.changed.style && this.changed.style.auto_style && this.changed.style.auto_style.definition;
    var previous = this.previousAttributes();
    var former = previous.style && previous.style.auto_style && previous.style.auto_style.definition;

    if (!_.isEqual(changed, former)) {
      this.trigger('customAutoStyle', this);
    }
  },

  /**
   * @public
   */
  remove: function () {
    this.dataviewModel.remove();
    this.trigger('destroy', this);
    this.stopListening();
  },

  isAutoStyleEnabled: function () {
    if (!this.defaults.autoStyleEnabled) return false;

    var styles = this.get('style');

    if (this.get('type') === 'category' || this.get('type') === 'histogram') {
      if (!styles || !styles.auto_style) {
        return true;
      }

      return styles && styles.auto_style && styles.auto_style.allowed;
    } else {
      return false;
    }
  },

  getWidgetColor: function () {
    var styles = this.get('style');

    return styles && styles.widget_style &&
          styles.widget_style.definition &&
          styles.widget_style.definition.color &&
          styles.widget_style.definition.color.fixed;
  },

  hasColorsAutoStyle: function () {
    var autoStyle = this.getAutoStyle();
    var hasDefinedColors = false;

    if (!autoStyle || _.isEmpty(autoStyle) || _.isEmpty(autoStyle.definition)) {
      return false;
    }

    // Check colors in all geometries
    _.each(autoStyle.definition, function (geometryStyle) {
      if (geometryStyle.color && geometryStyle.color.range && geometryStyle.color.range.length > 0) {
        hasDefinedColors = true;
      }
    }, this);

    return hasDefinedColors;
  },

  getColor: function (name) {
    if (this.isAutoStyleEnabled() && this.isAutoStyle() && this.get('type') === 'category') {
      return this.autoStyler.colors.getColorByCategory(name);
    } else {
      return this.getWidgetColor();
    }
  },

  isAutoStyle: function () {
    return this.get('autoStyle');
  },

  autoStyle: function () {
    if (!this.isAutoStyleEnabled()) return;
    if (!this.dataForAutoStyle()) return;

    var layer = this.dataviewModel.layer;
    var initialStyle = layer.get('cartocss');
    if (!initialStyle && layer.get('meta')) {
      initialStyle = layer.get('meta').cartocss;
    }
    layer.set('initialStyle', initialStyle);

    var style = this.autoStyler.getStyle();
    layer.set('cartocss', style);
    this.set('autoStyle', true);
  },

  dataForAutoStyle: function () {
    return this.dataviewModel.get('data').length > 0;
  },

  reapplyAutoStyle: function () {
    var style = this.autoStyler.getStyle();
    this.dataviewModel.layer.set('cartocss', style);
    this.set('autoStyle', true);
  },

  cancelAutoStyle: function (noRestore) {
    if (!noRestore) {
      this.dataviewModel.layer.restoreCartoCSS();
    }
    this.set('autoStyle', false);
  },

  getAutoStyle: function () {
    var style = this.get('style');
    var layerModel = this.dataviewModel.layer;
    var cartocss = layerModel.get('cartocss') || (layerModel.get('meta') && layerModel.get('meta').cartocss);

    if (this.isAutoStyleEnabled() && this.autoStyler) {
      if (style && style.auto_style && style.auto_style.definition) {
        var toRet = _.extend(style.auto_style, {cartocss: cartocss});
        return _.extend({}, toRet, {definition: this.autoStyler.getDef(cartocss)});
      } else {
        return {
          definition: this.autoStyler.getDef(cartocss),
          cartocss: cartocss
        };
      }
    }

    return {};
  },

  setInitialState: function (state) {
    this.initialState = state || {};
  },

  applyInitialState: function () {
    var attrs = _.extend(
      this.initialState,
      {hasInitialState: true}
    );

    this.setState(attrs);
  },

  setState: function (state) {
    this.set(state);
  },

  getState: function () {
    var state = {};
    for (var key in this.defaultState) {
      var attribute = this.get(key);
      var defaultValue = this.defaultState[key];
      if (typeof defaultValue !== 'undefined' && typeof attribute !== 'undefined' && !_.isEqual(attribute, defaultValue)) {
        state[key] = attribute;
      }
    }
    return state;
  }
});
