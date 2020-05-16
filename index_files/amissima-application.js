"use strict";

/* global document */
/* global window */
/* global $ */

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function vtexClass() {
  var initializing = false,
      fnTest = /xyz/.test(function () {
    xyz;
  }) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  window.VtexClass = function () {};

  // Create a new Class that inherits from this class
  VtexClass.extend = function (prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] === "function" && typeof _super[name] === "function" && fnTest.test(prop[name]) ? function (name, fn) {
        return function () {
          var tmp = this._super;

          // Add a new ._super() method that is the same method
          // but on the super-class
          this._super = _super[name];

          // The method only need to be bound temporarily, so we
          // remove it when we're done executing
          var ret = fn.apply(this, arguments);
          this._super = tmp;

          return ret;
        };
      }(name, prop[name]) : prop[name];
    }

    // The dummy class constructor
    function VtexClass() {
      // All construction is actually done in the init method
      if (!initializing && this.init) this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    VtexClass.prototype = prototype;

    // Enforce the constructor to be what we expect
    VtexClass.prototype.constructor = VtexClass;

    // And make this class extendable
    VtexClass.extend = vtexClass;

    return VtexClass;
  };
})();

/** Namespace **/
var APP = {
  core: {},
  component: {},
  controller: {},
  i: {}
};

$(window).load(function () {
  // new APP.core.Main();
});

$(document).ready(function () {
  new APP.core.Main();
});

/**
 * Util
 */
APP.core.Util = VtexClass.extend({
  getController: function getController() {
    var controller = $('meta[name=controller]').attr('content');
    return controller ? controller : false;
  }
});

/**
 * Main
 */
APP.core.Main = VtexClass.extend({
  init: function init() {
    this.start();
  },

  start: function start() {
    APP.i.util = new APP.core.Util();
    APP.i.general = new APP.controller.General();
    this.loadPageController();
  },

  loadPageController: function loadPageController() {
    var controller = APP.i.util.getController();

    if (controller) {
      APP.i.currentController = new APP.controller[controller]();
    }
  }
});
'use strict';

/**
 * @param {Object} Options
 * @example
 * $('body').vtexcart({parameters});
 */

(function ($) {
  'use strict';

  var settings = {};

  var cart = null;
  var helper = {
    openCart: function openCart() {
      var width = $(cart).innerWidth() * -1;
      $(cart).animate({
        right: 0
      });
      $('.vtex-cart-overlay').fadeIn('slow');
      $('html').addClass('cart-is-open');
    },
    closeCart: function closeCart() {
      var width = $(cart).innerWidth() * -1;
      // console.log('width',width);
      $(cart).animate({
        right: width
      }, 500, function () {
        $('.vtex-cart-overlay').fadeOut('fast');
      });
      $('html').removeClass('cart-is-open');
    },

    fillCart: function fillCart() {
      vtexjs.checkout.getOrderForm().done(function (orderForm) {
        console.log('orderform fillcart', orderForm);

        // if(orderForm.totalizers[1]){
        //   sessionStorage.removeItem('pftxCoupon');
        // }

        var items = orderForm.items;
        var i;

        $(cart).find('.vtex-cart-sub strong').html('R$ ' + helper.toReal(orderForm.totalizers[0].value));
        $(cart).find('.vtex-cart-discount strong').html('R$ ' + helper.toReal(orderForm.totalizers[1].value));
        $(cart).find('.vtex-cart-total strong').html('R$ ' + helper.toReal(orderForm.value));

        $('.header__content--minicart--link').attr('data-quantity', items.length);

        $(cart).find('ul').html('');

        if (items.length > 0) {

          $('.vtex-cart-resume a').removeClass('disabled');

          for (i = 0; i < items.length; i++) {

            // console.log('items[i]', items[i]);

            var template = '<li>' + '<button class="remove-item" data-index="' + i + '"></button>' + '<div class="vtex-cart-pdt-image">' + '<img src="' + items[i].imageUrl + '" />' + '</div>' + '<div class="vtex-cart-pdt-title">' + '<h4>' + items[i].name + '</h4>' + '</div>' + '<div class="vtex-cart-pdt-info">' +

            //Qty
            '<div class="vtex-cart-pdt-qtd">' + '<div class="list-count list-count-cart" data-index="' + i + '">' + '<div class="minus"><a href="#" class="qty-less"></a></div>' + '<div class="result"><input type="text" value="' + items[i].quantity + '" name="quantity" class="qty-field field" min="1" max="100" step="1" disabled/></div>' + '<div class="plus"><a href="#" class="qty-more"></a></div>' + '</div>' + '</div>' +
            //End Qty
            '<p>R$ ' + helper.toReal(items[i].price) + '</p>' + '</div>' + '</li>';

            $(cart).find('ul').append(template);
          }
        } else {
          $('.vtex-cart-resume .vtex-cart-send-request').addClass('disabled');
          $(cart).find('.vtex-cart-items').append('<span class="vtex-cart-items--empty">Sua sacola está vazia</span>');
          // helper.closeCart();
        }
      });
    },
    addItem: function addItem(el) {
      var urlTest = ["javascript", ":", "alert('Por favor, selecione o modelo desejado.');"].join('');
      var url = $(el).attr('href');

      if (url == urlTest) {
        alert('Por favor, selecione o modelo desejado.');
        return false;
      } else {
        helper.openCart();

        $.ajax({
          url: url.replace('true', 'false'),
          type: 'GET',
          crossDomain: true,
          dataType: 'html',
          success: function success() {
            helper.fillCart();
          }
        });
      }
    },
    removeItem: function removeItem(index) {
      if (confirm('Deseja realmente remover o item do carrinho?')) {
        vtexjs.checkout.getOrderForm().then(function (orderForm) {
          var item = orderForm.items[index];
          item.index = index;
          return vtexjs.checkout.removeItems([item]);
        }).done(function (orderForm) {
          helper.fillCart();
        });
      }
    },

    changeItem: function changeItem(itemIndex, quantity) {
      console.log('itemIndex', itemIndex);
      vtexjs.checkout.getOrderForm().then(function (data) {
        var updateItem = {
          index: parseInt(itemIndex),
          quantity: parseInt(quantity)
        };

        vtexjs.checkout.updateItems([updateItem], null, false);
      }).done(function () {
        helper.fillCart();
      });
    },

    toReal: function toReal(int) {
      if (int < 0) {
        var tmp = int * -1 + '';
        tmp = tmp.replace(/([0-9]{2})$/g, ",$1");
        if (tmp.length > 6) tmp = tmp.replace(/([0-9]{3}),([0-9]{2}$)/g, ".$1,$2");

        return '-' + tmp;
      } else {
        var tmp = int + '';
        tmp = tmp.replace(/([0-9]{2})$/g, ",$1");
        if (tmp.length > 6) tmp = tmp.replace(/([0-9]{3}),([0-9]{2}$)/g, ".$1,$2");

        return tmp;
      }
    },
    coupon: function coupon() {
      /*
      Form coupon
       */
      $(document).find('.vtex-cart-coupon').on('submit', function (e) {
        e.preventDefault();
        var discountCoupon = $(this).find('.vtex-cart-coupon-input').val();
        console.log('discountCoupon', discountCoupon);
        helper.addCoupon(discountCoupon);
      });
      /*
      Remove coupon
       */
      $(document).find('.vtex-cart-coupon-info-remove').on('click', function (e) {
        e.preventDefault();
        helper.removeCoupon();
        return vtexjs.checkout.clearMessages();
      });

      /*
      Verify coupon
       */
      var data = sessionStorage.getItem('pftxCoupon');
      if (data) {
        $('.vtex-cart-coupon').hide();
        $('.vtex-cart-coupon-info').show();
        $('.vtex-cart-coupon-info').find('.vtex-cart-coupon-value').html(data);
      }
    },
    addCoupon: function addCoupon(coupon) {
      vtexjs.checkout.getOrderForm().then(function (orderForm) {
        return vtexjs.checkout.addDiscountCoupon(coupon);
      }).then(function (orderForm) {
        var msgLength = orderForm.messages.length;

        console.log('orderForm.messages', orderForm.messages);

        if (msgLength) {
          var msg = orderForm.messages[0].text;
          // alert(msg);
          alert('Ops! Algo deu errado.');
          return vtexjs.checkout.clearMessages();
        } else {
          alert('Cupom adicionado!');
          $('.vtex-cart-coupon').hide();
          $('.vtex-cart-coupon-info').show();
          $('.vtex-cart-coupon-info').find('.vtex-cart-coupon-value').html(coupon);
          sessionStorage.setItem('pftxCoupon', coupon);
        }

        helper.fillCart();
      });
    },
    removeCoupon: function removeCoupon() {
      vtexjs.checkout.getOrderForm().then(function (orderForm) {
        return vtexjs.checkout.removeDiscountCoupon();
      }).then(function (orderForm) {
        alert('Cupom removido.');
        sessionStorage.removeItem('pftxCoupon');
        $('.vtex-cart-coupon').show();
        $('.vtex-cart-coupon-info').hide();
        helper.fillCart();
        // console.log(orderForm);
      });
    },

    /*
    Shipping
     */
    shipping: function shipping() {
      $('.vtex-cart-freight').on('submit', function (e) {
        e.preventDefault();
        var postalCode = $(this).find('input[type="text"]').val();
        helper.calculateShipping(postalCode);
      });
    },
    calculateShipping: function calculateShipping(postalCode) {
      vtexjs.checkout.getOrderForm().then(function (orderForm) {
        if (postalCode !== null) {
          var address = {
            "postalCode": postalCode,
            "country": 'BRA'
          };
          return vtexjs.checkout.calculateShipping(address);
        } else {
          console.log('error');
        }
      }).done(function (orderForm) {
        alert('Frete calculado.');
        helper.fillCart();
        // helper.setAddress(postalCode);
        console.log('orderForm.shippingData', orderForm.shippingData);
        console.log('orderForm.totalizers', orderForm.totalizers);
      });
    },
    setAddress: function setAddress(postalCode) {
      console.log('postalCode', postalCode);

      vtexjs.checkout.getOrderForm().then(function (orderForm) {
        console.log(orderForm);
        if (postalCode !== null) {
          var data = {
            "postalCode": postalCode,
            "country": 'BRA'
          };
          vtexjs.checkout.calculateShipping(data).then(function (orderForm) {
            var logistic = orderForm.logisticsInfo;
            var sd = orderForm.shippingData;
            var deliveryOption = JSON.parse(sessionStorage.getItem('pftx-deliveryChannelContent')) || false;
            console.log('sd', sd);
            console.log('logistic', logistic);
            if (deliveryOption) {
              sd.logisticsInfo[0].selectedDeliveryChannel = deliveryOption.deliveryChannel;
              sd.logisticsInfo[0].selectedSla = deliveryOption.name;

              vtexjs.checkout.sendAttachment('shippingData', sd).then(function (resp) {
                console.log(resp);
              });
            } else {
              // vtexjs.checkout.removeAllItems().then(function(){
              // 	location.href = "/";
              // });
            }
          });
        }
      });
    }

  };

  $.fn.vtexcart = function (parameters) {

    var el = this;

    settings = $.extend(settings, parameters);

    var cartHtml = '<div class="vtex-cart-overlay"></div>' + '<div class="vtex-cart-container">' + '<div class="vtex-cart-title">' + '<button class="vtex-cart-close"></button>' + '<h3>Minha sacola</h3>' + '</div>' + '<div class="vtex-cart-items"> <ul></ul> </div>' + '<div class="vtex-cart-resume">' +
    // '<form class="vtex-cart-freight" action="">Frete<strong style="display:none">0</strong><input type="text" /><button type="submit">Calcular</button></form>'+

    '<div class="vtex-cart-coupon-info" style="display: none;"><span class="vtex-cart-coupon-value"></span><a href="javascript:void(0);" class="vtex-cart-coupon-info-remove">excluir</a></div>' + '<form action="" class="vtex-cart-coupon">' + '<span>Cupom de desconto</span>' + '<input type="text" class="vtex-cart-coupon-input" placeholder="Código"><button type="submit" class="vtex-cart-coupon-add">Adicionar</button>' + '</form>' + '<span class="vtex-cart-sub">Subtotal<strong>R$ 0,00</strong></span>' + '<span class="vtex-cart-discount">Descontos<strong>R$ 0,00</strong></span>' + '<span class="vtex-cart-total">Total<strong>R$ 0,00</strong></span>' + '<a href="/checkout/#/email" class="vtex-cart-send-request">Fechar pedido</a>' + '<a href="#" class="vtex-cart-back-to-shop">Escolher mais produtos</a>' + '</div>' + '</div>';

    var miniCartHtml = '<a href="#" class="openCart"><span></span></a>';

    $(el).append(cartHtml);

    if (settings.cartButton) {
      $(settings.cartButton).append(miniCartHtml);
    }

    cart = $(el).find('.vtex-cart-container');

    helper.fillCart();
    helper.coupon();
    helper.shipping();

    /*
    DIRECTIVES
     */

    $(settings.buyButton).on('click', function (event) {
      helper.addItem($(this));

      event.preventDefault();
    });

    $('.header__content--minicart--link').on('click', function (event) {
      helper.openCart();
      event.preventDefault();
    });

    $('.vtex-cart-close, .vtex-cart-overlay, .vtex-cart-back-to-shop').on('click', function (event) {
      helper.closeCart();
      event.preventDefault();
    });

    $(document).keydown(function (event) {
      if ($('html').hasClass('cart-is-open')) {
        if (event.key == 'Escape' || event.key == 'Esc' || event.keyCode == 27) {
          helper.closeCart();
          event.preventDefault();
        }
      }
    });

    $(".vtex-cart-container").on("click", ".list-count-cart a", function (event) {
      event.preventDefault();
      console.log('change qty');
      var btnAction = $(this),
          dataIndex = btnAction.closest(".list-count-cart").attr("data-index"),
          qtyField = btnAction.closest(".list-count-cart").find(".qty-field"),
          quantity = parseInt(qtyField.val(), 10) || 0,
          qtyMin = qtyField.attr("min"),
          qtyMax = qtyField.attr("max");
      btnAction.hasClass("qty-less") ? quantity != qtyMin && quantity-- : qtyMax > quantity && quantity++, helper.changeItem(dataIndex, quantity);
    }), $('.vtex-cart-container').on('click', '.remove-item', function () {
      var index = $(this).data('index');
      helper.removeItem(index);
    });

    $('.vtex-cart-resume a').on('click', function () {
      if ($(this).hasClass('disabled')) {
        return false;
      } else {
        return true;
      }
    });
  };
})(jQuery);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*!
 * Vtex Search
 * Licensed MIT
 */

;(function ($) {
  window.VtexSearch = {
    //  _       _ _
    // (_)_ __ (_) |_
    // | | '_ \| | __|
    // | | | | | | |_
    // |_|_| |_|_|\__|
    //

    init: function init($result, settings) {
      var self = this;

      self.options = $.extend(self.getDefaultOptions(), settings);
      self.options.$result = $result;

      self.start();
      self.bind();
    },

    start: function start() {
      var self = this;

      self.request = self._setRequest();
      self._concatRequest();
      self._setPaginationInfo();

      self.options.pagination && self._setPaginationWrap();

      self._createButtons();

      self.checkAndStart();
    },

    _createButtons: function _createButtons() {
      var self = this;

      $('.resultItemsWrapper div[id^=ResultItems]').before('<button class="' + self.options.classLoadLess + ' ' + self.options.classLoadBtnHide + '">' + self.options.textLoadLess + '</button>').after('<button class="' + self.options.classLoadMore + '">' + self.options.textLoadMore + '</button>');
    },

    _setPaginationWrap: function _setPaginationWrap() {
      var self = this;

      var $pagination = $('<div />', {
        class: self.options.classPagination
      });

      self.options.$pager.after($pagination);
    },

    //       _               _
    //   ___| |__   ___  ___| | __
    //  / __| '_ \ / _ \/ __| |/ /
    // | (__| | | |  __/ (__|   <
    //  \___|_| |_|\___|\___|_|\_\
    //

    checkAndStart: function checkAndStart() {
      var self = this;

      self._checkRequestWithCookie() ? self.startWithCookie() : self.startWithoutCookie();

      self.options.$result.trigger('vtexsearch.init', [self.options, self.request]);
    },

    _checkRequestWithCookie: function _checkRequestWithCookie() {
      var self = this;

      if (typeof Cookies === 'undefined') {
        throw new Error('You need install this plugin https://github.com/js-cookie/js-cookie');

        return false;
      }

      var hash = parseInt(window.location.hash.substr(1));
      var cookie = Cookies.get(self.options.cookieName);

      if (typeof cookie === 'undefined') {
        return false;
      }

      var cookieRequest = JSON.parse(cookie);
      var localRequest = $.extend({}, self.request);

      return !isNaN(hash) && typeof cookieRequest !== 'undefined' && localRequest.path === cookieRequest.path;
    },

    //      _             _
    //  ___| |_ __ _ _ __| |_
    // / __| __/ _` | '__| __|
    // \__ \ || (_| | |  | |_
    // |___/\__\__,_|_|   \__|
    //

    startWithCookie: function startWithCookie() {
      var self = this;

      self._setParamsFromCookie();
      self._applyCookieParams();

      self._getTotalItems(function (totalItems) {
        self.options.totalItems = parseInt(totalItems);
        self.options.$totalItems.text(totalItems);
        self.options.totalPages = self._getTotalPages();

        self._checkAndLoadWithCookie();
      });
    },

    _checkAndLoadWithCookie: function _checkAndLoadWithCookie() {
      var self = this;

      var pageNumber = self.request.query.PageNumber;
      var totalPages = self.options.totalPages;

      self.options.$result.trigger('vtexsearch.initWithCookie', [self.options, self.request]);

      if (self.options.pagination) {
        self._startPagination();
        self.load('html', pageNumber, function () {
          self._showItems(pageNumber);
        });

        return false;
      }

      if (pageNumber === totalPages && pageNumber !== 1) {
        self._showButton(self.options.classLoadLess);
        self._hideButton(self.options.classLoadMore);

        self.load('html', pageNumber, function () {
          self._showItems(pageNumber);

          self.load('prepend', pageNumber - 1);
        });
      } else if (pageNumber === 1) {
        self._startFirst(pageNumber, totalPages === 1 ? false : true);
      } else if (pageNumber > 1) {
        self._showButton(self.options.classLoadMore);
        self._showButton(self.options.classLoadLess);

        self.load('html', pageNumber, function () {
          self._setUrlHash(pageNumber);
          self._showItems(pageNumber);

          self.load('append', pageNumber + 1, function () {
            self.load('prepend', pageNumber - 1, function () {
              self.request.query.PageNumber = pageNumber;
              self._concatRequest();
              self._saveCookie();
            });
          });
        });
      }
    },

    _startFirst: function _startFirst(pageNumber, startSecond, callback) {
      var self = this;

      if (typeof startSecond === 'undefined') {
        startSecond = true;
      }

      if (self.options.pagination === true) {
        startSecond = false;
      }

      self._hideButton(self.options.classLoadLess);

      self.load('html', pageNumber, function () {
        self._showItems(pageNumber);
        self._saveCookie();

        if (startSecond) {
          self.load('append', pageNumber + 1, function () {
            self._showButton(self.options.classLoadMore);

            typeof callback !== 'undefined' && callback();
          });
        } else {
          self._hideButton(self.options.classLoadMore);

          typeof callback !== 'undefined' && callback();
        }
      });
    },

    startWithoutCookie: function startWithoutCookie() {
      var self = this;

      self.options.$result.find('> div > ul > li').attr('page', 1).removeClass('last first');

      // self._setUrlHash(1);
      self._saveCookie();

      if (self._checkDefaultParams()) {
        self._setDefaultParams();
      }

      if (self.options.pagination) {
        self._startPagination();
      }

      if (self.options.totalPages === 1) {
        self._hideButton(self.options.classLoadMore);
        self._disableButton(self.options.classLoadMore);

        if (self._checkDefaultParams() || self.options.checkHasDefaultParams) {
          self._startFirst(1, true);
        }
      } else {
        if (self._checkDefaultParams() || self.options.checkHasDefaultParams) {
          self._startFirst(1, true);
        } else {
          self.load('append', 2);
        }
      }
    },

    _startPagination: function _startPagination() {
      var self = this;

      self._hideButton(self.options.classLoadMore);
      self._disableButton(self.options.classLoadMore);

      self._hideButton(self.options.classLoadLess);
      self._disableButton(self.options.classLoadLess);

      self._createPagination();
      self.bindPagination();
    },

    _clearPagination: function _clearPagination() {
      var self = this;

      self.options.$pagination.html('');
    },

    //  _                 _
    // | | ___   __ _  __| |
    // | |/ _ \ / _` |/ _` |
    // | | (_) | (_| | (_| |
    // |_|\___/ \__,_|\__,_|
    //

    load: function load(method, page, callback) {
      var self = this;

      self.request.query.PageNumber = page;
      self._concatRequest();

      typeof callback === 'function' ? self._search(method, callback) : self._search(method);
    },

    _search: function _search(method, callback, attempts) {
      var self = this;

      self.options.$result.trigger('vtexsearch.beforeSearch', [self.options, self.request]);

      if (typeof attempts === 'undefined') {
        attempts = 0;
      }

      $.ajax({
        url: self.request.url,
        type: 'GET'
      }).then(function (response) {
        var $list = self.options.$result.find('> div > ul');
        var $products = $(response).find('ul');

        $products.find('.last, .first').removeClass('last first');
        $products.find('.helperComplement').remove();

        var $item = $products.find('li');
        $item.attr('page', self.request.query.PageNumber);
        $item.addClass(self.options.classItemPreLoad);

        var productsContent = $products.html() || '';
        $list[method](productsContent);

        if (self.options.$result.is(':hidden')) {
          self.options.$result.show();
        }

        self.options.$result.trigger('vtexsearch.afterSearch', [self.options, self.request]);

        attempts = 0;

        typeof callback === 'function' && callback(self);
      }, function (response) {
        if (response.status === 500 && attempts < self.options.attempts) {
          attempts++;
          self._search(method, callback, attempts);
        }

        throw new Error('Error on get page', response);
      });
    },

    //  _          _
    // | |__   ___| |_ __   ___ _ __ ___
    // | '_ \ / _ \ | '_ \ / _ \ '__/ __|
    // | | | |  __/ | |_) |  __/ |  \__ \
    // |_| |_|\___|_| .__/ \___|_|  |___/
    //              |_|

    _setParamsFromCookie: function _setParamsFromCookie() {
      var self = this;

      var cookie = Cookies.get(self.options.cookieName);

      self.request = JSON.parse(cookie);
    },

    _applyCookieParams: function _applyCookieParams() {
      var self = this;

      self._setOrder();
      self._setFilters();
    },

    _setOrder: function _setOrder() {
      var self = this;

      self.options.$selectOrder.val(self.request.O);
    },

    _setFilters: function _setFilters(fq) {
      var self = this;

      var fq = self.request.query.fq;

      for (var filter in fq) {
        var value = fq[filter];

        if (typeof value === 'function') {
          return true;
        }

        var $checkbox = self.options.$filters.find('input[rel="fq=' + value + '"]');

        if ($checkbox.length) {
          $checkbox.attr('checked', 'checked').parent().addClass(self.options.classFilterActive);
        }
      }
    },

    _checkDefaultParams: function _checkDefaultParams() {
      var self = this;

      return !!Object.keys(self.options.defaultParams).length;
    },

    _setDefaultParams: function _setDefaultParams() {
      var self = this;

      if (self.request.query.hasOwnProperty('O')) {
        delete self.options.defaultParams.query.O;
      }

      self.request = $.extend(true, self.request, self.options.defaultParams);
    },

    _setUrlHash: function _setUrlHash(page) {
      var self = this;

      var pageNumber = typeof page !== 'undefined' ? page : self.request.query.PageNumber;
      window.location.hash = pageNumber;
    },

    _showItems: function _showItems(page) {
      var self = this;

      self.options.$result.trigger('vtexsearch.beforeShowItems', [self.options, self.request, page]);

      self.options.$result.find('.' + self.options.classItemPreLoad + '[page="' + page + '"]').removeClass(self.options.classItemPreLoad);

      self.options.$result.trigger('vtexsearch.afterShowItems', [self.options, self.request, page]);
    },

    _enableButton: function _enableButton(button) {
      var self = this;

      $('.' + button).removeAttr('disabled');
    },

    _disableButton: function _disableButton(button) {
      var self = this;

      $('.' + button).attr('disabled', 'disabled');
    },

    _hideButton: function _hideButton(button) {
      var self = this;

      $('.' + button).addClass(self.options.classLoadBtnHide);
    },

    _showButton: function _showButton(button) {
      var self = this;

      $('.' + button).removeClass(self.options.classLoadBtnHide);
    },

    /**
     * _getPageByType
     * @param  {string} type 'next' or 'prev'
     * @return {object}      showPage and nextPage
     */
    _getPageByType: function _getPageByType(type) {
      var self = this;

      var $items = self.options.$result.find('> div > ul > li');

      var method = 'last';
      var operation = '+';

      if (type === 'prev') {
        method = 'first';
        operation = '-';
      }

      var page = Number($items[method]().attr('page'));

      return {
        showPage: page,
        nextPage: eval(page + operation + 1)
      };
    },

    _concatRequest: function _concatRequest() {
      var self = this;

      var query = self.request.query;
      var url = self.request.route + '?';

      var len = Object.keys(query).length - 1;
      var index = 0;

      for (var item in query) {
        if (item === 'fq') {
          var fqResult = self._concatRequestFilter(query[item], item);
          url = url.concat(fqResult);
        } else {
          url = url.concat(item, '=', query[item]);
        }

        if (index !== len) {
          url = url.concat('&');
        }

        index++;
      }

      self.request.url = url;
    },

    _concatRequestFilter: function _concatRequestFilter(array, item) {
      var self = this;

      var url = '';

      for (var i = 0, length = array.length; i < length; i++) {
        url = url.concat(item, '=', array[i]);

        if (i !== length - 1) {
          url = url.concat('&');
        }
      }

      return url;
    },

    _saveCookie: function _saveCookie(request) {
      var self = this;

      if (typeof request === 'undefined') {
        request = JSON.parse(JSON.stringify(self.request));
      }

      var requestStringify = JSON.stringify(request);

      Cookies.set(self.options.cookieName, requestStringify);
    },

    _loadNext: function _loadNext(pageByType) {
      var self = this;

      if (pageByType.nextPage < 1 || pageByType.nextPage > self.options.totalPages) {
        return false;
      }

      return true;
    },

    _setPaginationInfo: function _setPaginationInfo() {
      var self = this;

      self.options.totalItems = self._getTotalItems();
      self.options.totalPages = self._getTotalPages();
    },

    _loadFirst: function _loadFirst(callback) {
      var self = this;

      self._getTotalItems(function (totalItems) {
        self.options.totalItems = parseInt(totalItems);
        self.options.$totalItems.text(totalItems);
        self.options.totalPages = self._getTotalPages();

        self._startFirst(1, self.options.totalPages < 2 ? false : true, callback);
      });
    },

    /**
     * Get total items
     * @param  {function} callback If have callback means that it will pick up from API, else pick up from element in page
     * @return {number}
     */
    _getTotalItems: function _getTotalItems(callback, attempts) {
      var self = this;

      /**
       * Get total items from API
       */
      if (typeof callback === 'function') {
        if (typeof attempts === 'undefined') {
          attempts = 0;
        }

        self._concatRequest();

        var requestUrl = self.request.url.replace('/buscapagina', '');
        var url = '/api/catalog_system/pub/products/search' + requestUrl + '&_from=0&_to=1';

        $.ajax({
          url: url,
          type: 'get'
        }).then(function (response, textStatus, request) {
          var resources = request.getResponseHeader('resources');
          var totalItems = parseInt(resources.split('/')[1]);

          attempts = 0;

          return callback(totalItems);
        }, function (error) {
          if (response.status === 500 && attempts < self.options.attempts) {
            attempts++;
            self._getTotalItems(callback, attempts);
          }

          throw new Error('Error on get total items', response);
        });

        return false;
      }

      /**
       * Get total items from element
       */
      var result = self.options.$totalItems.text();
      var pattern = /\D/g;
      var total = result.replace(pattern, '');

      return parseInt(Math.ceil(total));
    },

    _getTotalPages: function _getTotalPages() {
      var self = this;

      var ps = self.request.query.PS;
      var totalItems = self.options.totalItems;

      var totalPages = Math.ceil(totalItems / ps);

      return totalPages;
    },

    /**
     * Pagination
     */
    _createPagination: function _createPagination() {
      var self = this;

      self.options.$pagination = $('.' + self.options.classPagination);

      self._createPaginationFirstButton();
      self._createPaginationPrevButton();
      self._createPaginationButtons();
      self._createPaginationNextButton();
      self._createPaginationLastButton();
    },

    _createPaginationFirstButton: function _createPaginationFirstButton() {
      var self = this;

      var $first = $('<button />', {
        class: 'pagination__button pagination__button--first',
        page: '1'
      }).text(self.options.textPaginationFirst);

      if (self.request.query.PageNumber === 1) {
        self._disablePaginationButton($first);
      }

      self.options.$pagination.append($first);
    },

    _createPaginationPrevButton: function _createPaginationPrevButton() {
      var self = this;

      var $prev = $('<button />', {
        class: 'pagination__button pagination__button--prev',
        page: self.request.query.PageNumber - 1
      }).text(self.options.textPaginationPrev);

      if (self.request.query.PageNumber === 1) {
        self._disablePaginationButton($prev);
      }

      self.options.$pagination.append($prev);
    },

    _createPaginationButtons: function _createPaginationButtons() {
      var self = this;

      for (var i = self.request.query.PageNumber - self.options.paginationRangeButtons; i <= self.request.query.PageNumber; i++) {
        if (i < 1 || i === self.request.query.PageNumber) {
          continue;
        }

        var $page = $('<button />', {
          class: 'pagination__button pagination__button--page',
          page: i
        }).text(i);
        self.options.$pagination.append($page);
      }

      var $page = $('<button />', {
        class: 'pagination__button pagination__button--page pagination__button--disabled pagination__button--current',
        page: self.request.query.PageNumber,
        disabled: 'disabled'
      }).text(self.request.query.PageNumber);
      self.options.$pagination.append($page);

      for (var i = self.request.query.PageNumber + 1; i <= self.request.query.PageNumber + self.options.paginationRangeButtons; i++) {
        if (i > self._getTotalPages()) {
          continue;
        }

        var $page = $('<button />', {
          class: 'pagination__button pagination__button--page',
          page: i
        }).text(i);
        self.options.$pagination.append($page);
      }
    },

    _createPaginationNextButton: function _createPaginationNextButton() {
      var self = this;

      var $next = $('<button />', {
        class: 'pagination__button pagination__button--next',
        page: self.request.query.PageNumber + 1
      }).text(self.options.textPaginationNext);

      if (self.request.query.PageNumber === self._getTotalPages()) {
        self._disablePaginationButton($next);
      }

      self.options.$pagination.append($next);
    },

    _createPaginationLastButton: function _createPaginationLastButton() {
      var self = this;

      var $last = $('<button />', {
        class: 'pagination__button pagination__button--last',
        page: self._getTotalPages()
      }).text(self.options.textPaginationLast);

      if (self.request.query.PageNumber === self._getTotalPages()) {
        self._disablePaginationButton($last);
      }

      self.options.$pagination.append($last);
    },

    _disablePaginationButton: function _disablePaginationButton($element) {
      var self = this;

      $element.addClass('pagination__button--disabled').attr('disabled', 'disabled');
    },

    //                                 _                     _       _     _
    //  _ __ ___  __ _ _   _  ___  ___| |_  __   ____ _ _ __(_) __ _| |__ | | ___
    // | '__/ _ \/ _` | | | |/ _ \/ __| __| \ \ / / _` | '__| |/ _` | '_ \| |/ _ \
    // | | |  __/ (_| | |_| |  __/\__ \ |_   \ V / (_| | |  | | (_| | |_) | |  __/
    // |_|  \___|\__, |\__,_|\___||___/\__|   \_/ \__,_|_|  |_|\__,_|_.__/|_|\___|
    //              |_|
    //

    _setRequest: function _setRequest() {
      var self = this;

      var requestUrl = self._getRequestUrl();

      return self._splitRequestUrl(requestUrl);
    },

    _getRequestUrl: function _getRequestUrl() {
      var self = this;

      var scriptContent = self.options.$script.html();
      var pattern = /\/buscapagina\?.+&PageNumber=/gi;
      var url = pattern.exec(scriptContent)[0];

      return decodeURIComponent(url);
    },

    _splitRequestUrl: function _splitRequestUrl(url) {
      var self = this;

      var splitUrl = url.split('?');
      var route = splitUrl[0];

      if (splitUrl.length > 1) {
        var location = window.location;
        var search = location.search;
        var queryStringVTEX = splitUrl[1];
        var queryStringBrowser = search.substr(1);
        var splitHash = queryStringVTEX.split('#');

        var query = splitHash[0];
        var hash = splitHash[1];

        self.options.queryObject = {};
        self.options.queryObject['fq'] = [];

        var pattern = new RegExp('([^=&]+)=([^&]*)', 'g');

        query.replace(pattern, function (m, key, value) {
          self._buildQueryStringVTEXParams(m, key, value, self);
        });
        queryStringBrowser.replace(pattern, function (m, key, value) {
          self._checkAndInsertQueryStringBrowserParams(m, key, value, self);
        });

        return {
          route: route,
          query: self.options.queryObject,
          hash: hash,
          url: url,
          path: window.location.pathname + window.location.search
        };
      }

      return {
        route: route,
        url: url
      };
    },

    _buildQueryStringVTEXParams: function _buildQueryStringVTEXParams(m, key, value, self) {
      var urlValue = decodeURIComponent(value);
      var urlKey = decodeURIComponent(key);

      if (urlKey === 'fq') {
        self.options.queryObject[urlKey].push(urlValue);
      } else if (urlKey === 'PageNumber' && value === '') {
        self.options.queryObject[urlKey] = 1;
      } else {
        self.options.queryObject[urlKey] = urlValue;
      }
    },

    _checkAndInsertQueryStringBrowserParams: function _checkAndInsertQueryStringBrowserParams(m, key, value, self) {
      var urlValue = decodeURIComponent(value);
      var urlKey = decodeURIComponent(key);

      if (urlKey == 'O') {
        self.options.queryObject[urlKey] = urlValue;
        self.options.checkHasDefaultParams = true;
      }
    },

    //  _     _           _
    // | |__ (_)_ __   __| |
    // | '_ \| | '_ \ / _` |
    // | |_) | | | | | (_| |
    // |_.__/|_|_| |_|\__,_|
    //

    bind: function bind() {
      var self = this;

      self.bindLoadMoreAndLess();
      self.bindOrder();
      self.bindFilters();
    },

    bindLoadMoreAndLess: function bindLoadMoreAndLess() {
      var self = this;

      $('.' + self.options.classLoadLess + ', .' + self.options.classLoadMore).on('click', function (event) {
        event.preventDefault();

        var type = 'next';
        var method = 'append';
        var hide = self.options.classLoadMore;

        if ($(this).hasClass(self.options.classLoadLess)) {
          type = 'prev';
          method = 'prepend';
          hide = self.options.classLoadLess;
        }

        var pageByType = self._getPageByType(type);

        var request = $.extend({}, self.request);
        request.query.PageNumber = pageByType.showPage;
        self._saveCookie(request);

        self._loadNext(pageByType) ? self.load(method, pageByType.nextPage) : self._hideButton(hide);

        self._setUrlHash(pageByType.showPage);
        self._showItems(pageByType.showPage);
      });
    },

    bindOrder: function bindOrder() {
      var self = this;

      if (self.options.$selectOrder.attr('id') === 'O') {
        self.options.$selectOrder.removeAttr('onchange').unbind('change').off('change');
      }

      self.options.$selectOrder.on('change', function (event) {
        event.preventDefault();

        var _this = $(this);
        var value = _this.val();

        self.options.$result.trigger('vtexsearch.beforeChangeOrder', [self.options, self.request, _this]);
        self._setUrlHash(1);
        self._changeOrder(value, function () {
          self.options.$result.trigger('vtexsearch.afterChangeOrder', [self.options, self.request, _this]);
        });
      });
    },

    _changeOrder: function _changeOrder(value, callback) {
      var self = this;

      self.request.query.O = value;

      self._concatRequest();
      self._setUrlHash(1);

      self._loadFirst(callback);
    },

    bindFilters: function bindFilters() {
      var self = this;

      self.options.$filters.on('click', function (event) {
        if (event.target.tagName !== 'INPUT') {
          return true;
        }

        var _this = $(this);
        var $checkbox = _this.find('input');
        var checked = $checkbox.is(':checked');
        var filter = $checkbox.attr('rel');

        if (checked) {
          _this.addClass(self.options.classFilterActive);
        } else {
          _this.removeClass(self.options.classFilterActive);
        }

        self.options.$result.trigger('vtexsearch.beforeFilter', [self.options, self.request, _this]);
        self._refreshFilter(filter, checked, _this);
      });
    },

    /**
     * Refresh filter
     * @param  {string,array} filter Filter
     * @param  {boolean} action true: add; false: remove
     */
    _refreshFilter: function _refreshFilter(filter, action, _this) {
      var self = this;

      var filterMap = function filterMap(item) {
        var filterSplit = item.split('=');

        var key = filterSplit[0];
        var value = filterSplit[1];

        if (action) {
          self.request.query[key].push(value);
        } else {
          var index = self.request.query[key].indexOf(value);

          if (index > -1) {
            self.request.query[key].splice(index, 1);
          }
        }
      };

      if ((typeof filter === 'undefined' ? 'undefined' : _typeof(filter)) === 'object') {
        filter.map(filterMap);
      } else if (typeof filter === 'string') {
        filterMap(filter);
      }

      self._loadFirst(function () {
        self.options.$result.trigger('vtexsearch.afterFilter', [self.options, self.request, _this || null]);
        self._setUrlHash(1);

        if (self.options.pagination) {
          self._clearPagination();
          self._createPagination();
        }

        self.bindPagination();
      });
    },

    bindPagination: function bindPagination() {
      var self = this;

      $('.' + self.options.classPagination).find('button').on('click', function (e) {
        e.preventDefault();

        var _this = $(this);
        var page = parseInt(_this.attr('page'));

        self.options.$result.trigger('vtexsearch.beforeChangePage', [self.options, self.request]);

        self.load('html', page, function () {
          self._setUrlHash(page);
          self._showItems(page);

          self.request.query.PageNumber = page;
          self._clearPagination();
          self._startPagination();
          self._concatRequest();
          self._saveCookie();

          self.options.$result.trigger('vtexsearch.afterChangePage', [self.options, self.request]);
        });
      });
    },

    //              _   _
    //   ___  _ __ | |_(_) ___  _ __  ___
    //  / _ \| '_ \| __| |/ _ \| '_ \/ __|
    // | (_) | |_) | |_| | (_) | | | \__ \
    //  \___/| .__/ \__|_|\___/|_| |_|___/
    //       |_|

    getDefaultOptions: function getDefaultOptions() {
      var self = this;

      return {
        /**
         * Elements
         */
        $resultItemsWrapper: $('.resultItemsWrapper'),
        $script: $('.resultItemsWrapper').children('script'),
        $pager: $('.pager'),
        $totalItems: $('.searchResultsTime:first .resultado-busca-numero .value'),
        $selectOrder: $('#O'),
        $filters: $('.search-multiple-navigator label'),

        /**
         * Classes
         */
        classFilterActive: 'filter--active',
        classItemPreLoad: 'shelf-item--preload',
        classLoadBtnHide: 'load-btn--hide',
        classLoadLess: 'load-less',
        classLoadMore: 'load-more',
        classPagination: 'pagination',

        /**
         * Texts
         */
        textLoadLess: 'Load less',
        textLoadMore: 'Load more',
        textPaginationFirst: 'First',
        textPaginationPrev: 'Prev',
        textPaginationNext: 'Next',
        textPaginationLast: 'Last',
        textEmptyResult: 'No product found',
        /**
         * Pagination
         */
        pagination: false,
        paginationRangeButtons: 3,

        /**
         * Others
         */
        cookieName: 'VtexSearchQuery',
        defaultParams: {
          // 'query': {
          //   'O': 'OrderByPriceASC'
          // }
        },
        attempts: 1
      };
    }
  };

  $.fn.vtexSearch = function (settings) {
    var $result = this;

    VtexSearch.init($result, settings);

    return $result;
  };
})(jQuery);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
     _ _      _       _
 ___| (_) ___| | __  (_)___
/ __| | |/ __| |/ /  | / __|
\__ \ | | (__|   < _ | \__ \
|___/_|_|\___|_|\_(_)/ |___/
                   |__/

 Version: 1.8.0
  Author: Ken Wheeler
 Website: http://kenwheeler.github.io
    Docs: http://kenwheeler.github.io/slick
    Repo: http://github.com/kenwheeler/slick
  Issues: http://github.com/kenwheeler/slick/issues

 */
/* global window, document, define, jQuery, setInterval, clearInterval */
;(function (factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }
})(function ($) {
    'use strict';

    var Slick = window.Slick || {};

    Slick = function () {

        var instanceUid = 0;

        function Slick(element, settings) {

            var _ = this,
                dataSettings;

            _.defaults = {
                accessibility: true,
                adaptiveHeight: false,
                appendArrows: $(element),
                appendDots: $(element),
                arrows: true,
                asNavFor: null,
                prevArrow: '<button class="slick-prev" aria-label="Previous" type="button">Previous</button>',
                nextArrow: '<button class="slick-next" aria-label="Next" type="button">Next</button>',
                autoplay: false,
                autoplaySpeed: 3000,
                centerMode: false,
                centerPadding: '50px',
                cssEase: 'ease',
                customPaging: function customPaging(slider, i) {
                    return $('<button type="button" />').text(i + 1);
                },
                dots: false,
                dotsClass: 'slick-dots',
                draggable: true,
                easing: 'linear',
                edgeFriction: 0.35,
                fade: false,
                focusOnSelect: false,
                focusOnChange: false,
                infinite: true,
                initialSlide: 0,
                lazyLoad: 'ondemand',
                mobileFirst: false,
                pauseOnHover: true,
                pauseOnFocus: true,
                pauseOnDotsHover: false,
                respondTo: 'window',
                responsive: null,
                rows: 1,
                rtl: false,
                slide: '',
                slidesPerRow: 1,
                slidesToShow: 1,
                slidesToScroll: 1,
                speed: 500,
                swipe: true,
                swipeToSlide: false,
                touchMove: true,
                touchThreshold: 5,
                useCSS: true,
                useTransform: true,
                variableWidth: false,
                vertical: false,
                verticalSwiping: false,
                waitForAnimate: true,
                zIndex: 1000
            };

            _.initials = {
                animating: false,
                dragging: false,
                autoPlayTimer: null,
                currentDirection: 0,
                currentLeft: null,
                currentSlide: 0,
                direction: 1,
                $dots: null,
                listWidth: null,
                listHeight: null,
                loadIndex: 0,
                $nextArrow: null,
                $prevArrow: null,
                scrolling: false,
                slideCount: null,
                slideWidth: null,
                $slideTrack: null,
                $slides: null,
                sliding: false,
                slideOffset: 0,
                swipeLeft: null,
                swiping: false,
                $list: null,
                touchObject: {},
                transformsEnabled: false,
                unslicked: false
            };

            $.extend(_, _.initials);

            _.activeBreakpoint = null;
            _.animType = null;
            _.animProp = null;
            _.breakpoints = [];
            _.breakpointSettings = [];
            _.cssTransitions = false;
            _.focussed = false;
            _.interrupted = false;
            _.hidden = 'hidden';
            _.paused = true;
            _.positionProp = null;
            _.respondTo = null;
            _.rowCount = 1;
            _.shouldClick = true;
            _.$slider = $(element);
            _.$slidesCache = null;
            _.transformType = null;
            _.transitionType = null;
            _.visibilityChange = 'visibilitychange';
            _.windowWidth = 0;
            _.windowTimer = null;

            dataSettings = $(element).data('slick') || {};

            _.options = $.extend({}, _.defaults, settings, dataSettings);

            _.currentSlide = _.options.initialSlide;

            _.originalSettings = _.options;

            if (typeof document.mozHidden !== 'undefined') {
                _.hidden = 'mozHidden';
                _.visibilityChange = 'mozvisibilitychange';
            } else if (typeof document.webkitHidden !== 'undefined') {
                _.hidden = 'webkitHidden';
                _.visibilityChange = 'webkitvisibilitychange';
            }

            _.autoPlay = $.proxy(_.autoPlay, _);
            _.autoPlayClear = $.proxy(_.autoPlayClear, _);
            _.autoPlayIterator = $.proxy(_.autoPlayIterator, _);
            _.changeSlide = $.proxy(_.changeSlide, _);
            _.clickHandler = $.proxy(_.clickHandler, _);
            _.selectHandler = $.proxy(_.selectHandler, _);
            _.setPosition = $.proxy(_.setPosition, _);
            _.swipeHandler = $.proxy(_.swipeHandler, _);
            _.dragHandler = $.proxy(_.dragHandler, _);
            _.keyHandler = $.proxy(_.keyHandler, _);

            _.instanceUid = instanceUid++;

            // A simple way to check for HTML strings
            // Strict HTML recognition (must start with <)
            // Extracted from jQuery v1.11 source
            _.htmlExpr = /^(?:\s*(<[\w\W]+>)[^>]*)$/;

            _.registerBreakpoints();
            _.init(true);
        }

        return Slick;
    }();

    Slick.prototype.activateADA = function () {
        var _ = this;

        _.$slideTrack.find('.slick-active').attr({
            'aria-hidden': 'false'
        }).find('a, input, button, select').attr({
            'tabindex': '0'
        });
    };

    Slick.prototype.addSlide = Slick.prototype.slickAdd = function (markup, index, addBefore) {

        var _ = this;

        if (typeof index === 'boolean') {
            addBefore = index;
            index = null;
        } else if (index < 0 || index >= _.slideCount) {
            return false;
        }

        _.unload();

        if (typeof index === 'number') {
            if (index === 0 && _.$slides.length === 0) {
                $(markup).appendTo(_.$slideTrack);
            } else if (addBefore) {
                $(markup).insertBefore(_.$slides.eq(index));
            } else {
                $(markup).insertAfter(_.$slides.eq(index));
            }
        } else {
            if (addBefore === true) {
                $(markup).prependTo(_.$slideTrack);
            } else {
                $(markup).appendTo(_.$slideTrack);
            }
        }

        _.$slides = _.$slideTrack.children(this.options.slide);

        _.$slideTrack.children(this.options.slide).detach();

        _.$slideTrack.append(_.$slides);

        _.$slides.each(function (index, element) {
            $(element).attr('data-slick-index', index);
        });

        _.$slidesCache = _.$slides;

        _.reinit();
    };

    Slick.prototype.animateHeight = function () {
        var _ = this;
        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.animate({
                height: targetHeight
            }, _.options.speed);
        }
    };

    Slick.prototype.animateSlide = function (targetLeft, callback) {

        var animProps = {},
            _ = this;

        _.animateHeight();

        if (_.options.rtl === true && _.options.vertical === false) {
            targetLeft = -targetLeft;
        }
        if (_.transformsEnabled === false) {
            if (_.options.vertical === false) {
                _.$slideTrack.animate({
                    left: targetLeft
                }, _.options.speed, _.options.easing, callback);
            } else {
                _.$slideTrack.animate({
                    top: targetLeft
                }, _.options.speed, _.options.easing, callback);
            }
        } else {

            if (_.cssTransitions === false) {
                if (_.options.rtl === true) {
                    _.currentLeft = -_.currentLeft;
                }
                $({
                    animStart: _.currentLeft
                }).animate({
                    animStart: targetLeft
                }, {
                    duration: _.options.speed,
                    easing: _.options.easing,
                    step: function step(now) {
                        now = Math.ceil(now);
                        if (_.options.vertical === false) {
                            animProps[_.animType] = 'translate(' + now + 'px, 0px)';
                            _.$slideTrack.css(animProps);
                        } else {
                            animProps[_.animType] = 'translate(0px,' + now + 'px)';
                            _.$slideTrack.css(animProps);
                        }
                    },
                    complete: function complete() {
                        if (callback) {
                            callback.call();
                        }
                    }
                });
            } else {

                _.applyTransition();
                targetLeft = Math.ceil(targetLeft);

                if (_.options.vertical === false) {
                    animProps[_.animType] = 'translate3d(' + targetLeft + 'px, 0px, 0px)';
                } else {
                    animProps[_.animType] = 'translate3d(0px,' + targetLeft + 'px, 0px)';
                }
                _.$slideTrack.css(animProps);

                if (callback) {
                    setTimeout(function () {

                        _.disableTransition();

                        callback.call();
                    }, _.options.speed);
                }
            }
        }
    };

    Slick.prototype.getNavTarget = function () {

        var _ = this,
            asNavFor = _.options.asNavFor;

        if (asNavFor && asNavFor !== null) {
            asNavFor = $(asNavFor).not(_.$slider);
        }

        return asNavFor;
    };

    Slick.prototype.asNavFor = function (index) {

        var _ = this,
            asNavFor = _.getNavTarget();

        if (asNavFor !== null && (typeof asNavFor === 'undefined' ? 'undefined' : _typeof(asNavFor)) === 'object') {
            asNavFor.each(function () {
                var target = $(this).slick('getSlick');
                if (!target.unslicked) {
                    target.slideHandler(index, true);
                }
            });
        }
    };

    Slick.prototype.applyTransition = function (slide) {

        var _ = this,
            transition = {};

        if (_.options.fade === false) {
            transition[_.transitionType] = _.transformType + ' ' + _.options.speed + 'ms ' + _.options.cssEase;
        } else {
            transition[_.transitionType] = 'opacity ' + _.options.speed + 'ms ' + _.options.cssEase;
        }

        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }
    };

    Slick.prototype.autoPlay = function () {

        var _ = this;

        _.autoPlayClear();

        if (_.slideCount > _.options.slidesToShow) {
            _.autoPlayTimer = setInterval(_.autoPlayIterator, _.options.autoplaySpeed);
        }
    };

    Slick.prototype.autoPlayClear = function () {

        var _ = this;

        if (_.autoPlayTimer) {
            clearInterval(_.autoPlayTimer);
        }
    };

    Slick.prototype.autoPlayIterator = function () {

        var _ = this,
            slideTo = _.currentSlide + _.options.slidesToScroll;

        if (!_.paused && !_.interrupted && !_.focussed) {

            if (_.options.infinite === false) {

                if (_.direction === 1 && _.currentSlide + 1 === _.slideCount - 1) {
                    _.direction = 0;
                } else if (_.direction === 0) {

                    slideTo = _.currentSlide - _.options.slidesToScroll;

                    if (_.currentSlide - 1 === 0) {
                        _.direction = 1;
                    }
                }
            }

            _.slideHandler(slideTo);
        }
    };

    Slick.prototype.buildArrows = function () {

        var _ = this;

        if (_.options.arrows === true) {

            _.$prevArrow = $(_.options.prevArrow).addClass('slick-arrow');
            _.$nextArrow = $(_.options.nextArrow).addClass('slick-arrow');

            if (_.slideCount > _.options.slidesToShow) {

                _.$prevArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');
                _.$nextArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');

                if (_.htmlExpr.test(_.options.prevArrow)) {
                    _.$prevArrow.prependTo(_.options.appendArrows);
                }

                if (_.htmlExpr.test(_.options.nextArrow)) {
                    _.$nextArrow.appendTo(_.options.appendArrows);
                }

                if (_.options.infinite !== true) {
                    _.$prevArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                }
            } else {

                _.$prevArrow.add(_.$nextArrow).addClass('slick-hidden').attr({
                    'aria-disabled': 'true',
                    'tabindex': '-1'
                });
            }
        }
    };

    Slick.prototype.buildDots = function () {

        var _ = this,
            i,
            dot;

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$slider.addClass('slick-dotted');

            dot = $('<ul />').addClass(_.options.dotsClass);

            for (i = 0; i <= _.getDotCount(); i += 1) {
                dot.append($('<li />').append(_.options.customPaging.call(this, _, i)));
            }

            _.$dots = dot.appendTo(_.options.appendDots);

            _.$dots.find('li').first().addClass('slick-active');
        }
    };

    Slick.prototype.buildOut = function () {

        var _ = this;

        _.$slides = _.$slider.children(_.options.slide + ':not(.slick-cloned)').addClass('slick-slide');

        _.slideCount = _.$slides.length;

        _.$slides.each(function (index, element) {
            $(element).attr('data-slick-index', index).data('originalStyling', $(element).attr('style') || '');
        });

        _.$slider.addClass('slick-slider');

        _.$slideTrack = _.slideCount === 0 ? $('<div class="slick-track"/>').appendTo(_.$slider) : _.$slides.wrapAll('<div class="slick-track"/>').parent();

        _.$list = _.$slideTrack.wrap('<div class="slick-list"/>').parent();
        _.$slideTrack.css('opacity', 0);

        if (_.options.centerMode === true || _.options.swipeToSlide === true) {
            _.options.slidesToScroll = 1;
        }

        $('img[data-lazy]', _.$slider).not('[src]').addClass('slick-loading');

        _.setupInfinite();

        _.buildArrows();

        _.buildDots();

        _.updateDots();

        _.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);

        if (_.options.draggable === true) {
            _.$list.addClass('draggable');
        }
    };

    Slick.prototype.buildRows = function () {

        var _ = this,
            a,
            b,
            c,
            newSlides,
            numOfSlides,
            originalSlides,
            slidesPerSection;

        newSlides = document.createDocumentFragment();
        originalSlides = _.$slider.children();

        if (_.options.rows > 0) {

            slidesPerSection = _.options.slidesPerRow * _.options.rows;
            numOfSlides = Math.ceil(originalSlides.length / slidesPerSection);

            for (a = 0; a < numOfSlides; a++) {
                var slide = document.createElement('div');
                for (b = 0; b < _.options.rows; b++) {
                    var row = document.createElement('div');
                    for (c = 0; c < _.options.slidesPerRow; c++) {
                        var target = a * slidesPerSection + (b * _.options.slidesPerRow + c);
                        if (originalSlides.get(target)) {
                            row.appendChild(originalSlides.get(target));
                        }
                    }
                    slide.appendChild(row);
                }
                newSlides.appendChild(slide);
            }

            _.$slider.empty().append(newSlides);
            _.$slider.children().children().children().css({
                'width': 100 / _.options.slidesPerRow + '%',
                'display': 'inline-block'
            });
        }
    };

    Slick.prototype.checkResponsive = function (initial, forceUpdate) {

        var _ = this,
            breakpoint,
            targetBreakpoint,
            respondToWidth,
            triggerBreakpoint = false;
        var sliderWidth = _.$slider.width();
        var windowWidth = window.innerWidth || $(window).width();

        if (_.respondTo === 'window') {
            respondToWidth = windowWidth;
        } else if (_.respondTo === 'slider') {
            respondToWidth = sliderWidth;
        } else if (_.respondTo === 'min') {
            respondToWidth = Math.min(windowWidth, sliderWidth);
        }

        if (_.options.responsive && _.options.responsive.length && _.options.responsive !== null) {

            targetBreakpoint = null;

            for (breakpoint in _.breakpoints) {
                if (_.breakpoints.hasOwnProperty(breakpoint)) {
                    if (_.originalSettings.mobileFirst === false) {
                        if (respondToWidth < _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    } else {
                        if (respondToWidth > _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    }
                }
            }

            if (targetBreakpoint !== null) {
                if (_.activeBreakpoint !== null) {
                    if (targetBreakpoint !== _.activeBreakpoint || forceUpdate) {
                        _.activeBreakpoint = targetBreakpoint;
                        if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
                            _.unslick(targetBreakpoint);
                        } else {
                            _.options = $.extend({}, _.originalSettings, _.breakpointSettings[targetBreakpoint]);
                            if (initial === true) {
                                _.currentSlide = _.options.initialSlide;
                            }
                            _.refresh(initial);
                        }
                        triggerBreakpoint = targetBreakpoint;
                    }
                } else {
                    _.activeBreakpoint = targetBreakpoint;
                    if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
                        _.unslick(targetBreakpoint);
                    } else {
                        _.options = $.extend({}, _.originalSettings, _.breakpointSettings[targetBreakpoint]);
                        if (initial === true) {
                            _.currentSlide = _.options.initialSlide;
                        }
                        _.refresh(initial);
                    }
                    triggerBreakpoint = targetBreakpoint;
                }
            } else {
                if (_.activeBreakpoint !== null) {
                    _.activeBreakpoint = null;
                    _.options = _.originalSettings;
                    if (initial === true) {
                        _.currentSlide = _.options.initialSlide;
                    }
                    _.refresh(initial);
                    triggerBreakpoint = targetBreakpoint;
                }
            }

            // only trigger breakpoints during an actual break. not on initialize.
            if (!initial && triggerBreakpoint !== false) {
                _.$slider.trigger('breakpoint', [_, triggerBreakpoint]);
            }
        }
    };

    Slick.prototype.changeSlide = function (event, dontAnimate) {

        var _ = this,
            $target = $(event.currentTarget),
            indexOffset,
            slideOffset,
            unevenOffset;

        // If target is a link, prevent default action.
        if ($target.is('a')) {
            event.preventDefault();
        }

        // If target is not the <li> element (ie: a child), find the <li>.
        if (!$target.is('li')) {
            $target = $target.closest('li');
        }

        unevenOffset = _.slideCount % _.options.slidesToScroll !== 0;
        indexOffset = unevenOffset ? 0 : (_.slideCount - _.currentSlide) % _.options.slidesToScroll;

        switch (event.data.message) {

            case 'previous':
                slideOffset = indexOffset === 0 ? _.options.slidesToScroll : _.options.slidesToShow - indexOffset;
                if (_.slideCount > _.options.slidesToShow) {
                    _.slideHandler(_.currentSlide - slideOffset, false, dontAnimate);
                }
                break;

            case 'next':
                slideOffset = indexOffset === 0 ? _.options.slidesToScroll : indexOffset;
                if (_.slideCount > _.options.slidesToShow) {
                    _.slideHandler(_.currentSlide + slideOffset, false, dontAnimate);
                }
                break;

            case 'index':
                var index = event.data.index === 0 ? 0 : event.data.index || $target.index() * _.options.slidesToScroll;

                _.slideHandler(_.checkNavigable(index), false, dontAnimate);
                $target.children().trigger('focus');
                break;

            default:
                return;
        }
    };

    Slick.prototype.checkNavigable = function (index) {

        var _ = this,
            navigables,
            prevNavigable;

        navigables = _.getNavigableIndexes();
        prevNavigable = 0;
        if (index > navigables[navigables.length - 1]) {
            index = navigables[navigables.length - 1];
        } else {
            for (var n in navigables) {
                if (index < navigables[n]) {
                    index = prevNavigable;
                    break;
                }
                prevNavigable = navigables[n];
            }
        }

        return index;
    };

    Slick.prototype.cleanUpEvents = function () {

        var _ = this;

        if (_.options.dots && _.$dots !== null) {

            $('li', _.$dots).off('click.slick', _.changeSlide).off('mouseenter.slick', $.proxy(_.interrupt, _, true)).off('mouseleave.slick', $.proxy(_.interrupt, _, false));

            if (_.options.accessibility === true) {
                _.$dots.off('keydown.slick', _.keyHandler);
            }
        }

        _.$slider.off('focus.slick blur.slick');

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow && _.$prevArrow.off('click.slick', _.changeSlide);
            _.$nextArrow && _.$nextArrow.off('click.slick', _.changeSlide);

            if (_.options.accessibility === true) {
                _.$prevArrow && _.$prevArrow.off('keydown.slick', _.keyHandler);
                _.$nextArrow && _.$nextArrow.off('keydown.slick', _.keyHandler);
            }
        }

        _.$list.off('touchstart.slick mousedown.slick', _.swipeHandler);
        _.$list.off('touchmove.slick mousemove.slick', _.swipeHandler);
        _.$list.off('touchend.slick mouseup.slick', _.swipeHandler);
        _.$list.off('touchcancel.slick mouseleave.slick', _.swipeHandler);

        _.$list.off('click.slick', _.clickHandler);

        $(document).off(_.visibilityChange, _.visibility);

        _.cleanUpSlideEvents();

        if (_.options.accessibility === true) {
            _.$list.off('keydown.slick', _.keyHandler);
        }

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().off('click.slick', _.selectHandler);
        }

        $(window).off('orientationchange.slick.slick-' + _.instanceUid, _.orientationChange);

        $(window).off('resize.slick.slick-' + _.instanceUid, _.resize);

        $('[draggable!=true]', _.$slideTrack).off('dragstart', _.preventDefault);

        $(window).off('load.slick.slick-' + _.instanceUid, _.setPosition);
    };

    Slick.prototype.cleanUpSlideEvents = function () {

        var _ = this;

        _.$list.off('mouseenter.slick', $.proxy(_.interrupt, _, true));
        _.$list.off('mouseleave.slick', $.proxy(_.interrupt, _, false));
    };

    Slick.prototype.cleanUpRows = function () {

        var _ = this,
            originalSlides;

        if (_.options.rows > 0) {
            originalSlides = _.$slides.children().children();
            originalSlides.removeAttr('style');
            _.$slider.empty().append(originalSlides);
        }
    };

    Slick.prototype.clickHandler = function (event) {

        var _ = this;

        if (_.shouldClick === false) {
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();
        }
    };

    Slick.prototype.destroy = function (refresh) {

        var _ = this;

        _.autoPlayClear();

        _.touchObject = {};

        _.cleanUpEvents();

        $('.slick-cloned', _.$slider).detach();

        if (_.$dots) {
            _.$dots.remove();
        }

        if (_.$prevArrow && _.$prevArrow.length) {

            _.$prevArrow.removeClass('slick-disabled slick-arrow slick-hidden').removeAttr('aria-hidden aria-disabled tabindex').css('display', '');

            if (_.htmlExpr.test(_.options.prevArrow)) {
                _.$prevArrow.remove();
            }
        }

        if (_.$nextArrow && _.$nextArrow.length) {

            _.$nextArrow.removeClass('slick-disabled slick-arrow slick-hidden').removeAttr('aria-hidden aria-disabled tabindex').css('display', '');

            if (_.htmlExpr.test(_.options.nextArrow)) {
                _.$nextArrow.remove();
            }
        }

        if (_.$slides) {

            _.$slides.removeClass('slick-slide slick-active slick-center slick-visible slick-current').removeAttr('aria-hidden').removeAttr('data-slick-index').each(function () {
                $(this).attr('style', $(this).data('originalStyling'));
            });

            _.$slideTrack.children(this.options.slide).detach();

            _.$slideTrack.detach();

            _.$list.detach();

            _.$slider.append(_.$slides);
        }

        _.cleanUpRows();

        _.$slider.removeClass('slick-slider');
        _.$slider.removeClass('slick-initialized');
        _.$slider.removeClass('slick-dotted');

        _.unslicked = true;

        if (!refresh) {
            _.$slider.trigger('destroy', [_]);
        }
    };

    Slick.prototype.disableTransition = function (slide) {

        var _ = this,
            transition = {};

        transition[_.transitionType] = '';

        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }
    };

    Slick.prototype.fadeSlide = function (slideIndex, callback) {

        var _ = this;

        if (_.cssTransitions === false) {

            _.$slides.eq(slideIndex).css({
                zIndex: _.options.zIndex
            });

            _.$slides.eq(slideIndex).animate({
                opacity: 1
            }, _.options.speed, _.options.easing, callback);
        } else {

            _.applyTransition(slideIndex);

            _.$slides.eq(slideIndex).css({
                opacity: 1,
                zIndex: _.options.zIndex
            });

            if (callback) {
                setTimeout(function () {

                    _.disableTransition(slideIndex);

                    callback.call();
                }, _.options.speed);
            }
        }
    };

    Slick.prototype.fadeSlideOut = function (slideIndex) {

        var _ = this;

        if (_.cssTransitions === false) {

            _.$slides.eq(slideIndex).animate({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            }, _.options.speed, _.options.easing);
        } else {

            _.applyTransition(slideIndex);

            _.$slides.eq(slideIndex).css({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            });
        }
    };

    Slick.prototype.filterSlides = Slick.prototype.slickFilter = function (filter) {

        var _ = this;

        if (filter !== null) {

            _.$slidesCache = _.$slides;

            _.unload();

            _.$slideTrack.children(this.options.slide).detach();

            _.$slidesCache.filter(filter).appendTo(_.$slideTrack);

            _.reinit();
        }
    };

    Slick.prototype.focusHandler = function () {

        var _ = this;

        _.$slider.off('focus.slick blur.slick').on('focus.slick blur.slick', '*', function (event) {

            event.stopImmediatePropagation();
            var $sf = $(this);

            setTimeout(function () {

                if (_.options.pauseOnFocus) {
                    _.focussed = $sf.is(':focus');
                    _.autoPlay();
                }
            }, 0);
        });
    };

    Slick.prototype.getCurrent = Slick.prototype.slickCurrentSlide = function () {

        var _ = this;
        return _.currentSlide;
    };

    Slick.prototype.getDotCount = function () {

        var _ = this;

        var breakPoint = 0;
        var counter = 0;
        var pagerQty = 0;

        if (_.options.infinite === true) {
            if (_.slideCount <= _.options.slidesToShow) {
                ++pagerQty;
            } else {
                while (breakPoint < _.slideCount) {
                    ++pagerQty;
                    breakPoint = counter + _.options.slidesToScroll;
                    counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
                }
            }
        } else if (_.options.centerMode === true) {
            pagerQty = _.slideCount;
        } else if (!_.options.asNavFor) {
            pagerQty = 1 + Math.ceil((_.slideCount - _.options.slidesToShow) / _.options.slidesToScroll);
        } else {
            while (breakPoint < _.slideCount) {
                ++pagerQty;
                breakPoint = counter + _.options.slidesToScroll;
                counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
            }
        }

        return pagerQty - 1;
    };

    Slick.prototype.getLeft = function (slideIndex) {

        var _ = this,
            targetLeft,
            verticalHeight,
            verticalOffset = 0,
            targetSlide,
            coef;

        _.slideOffset = 0;
        verticalHeight = _.$slides.first().outerHeight(true);

        if (_.options.infinite === true) {
            if (_.slideCount > _.options.slidesToShow) {
                _.slideOffset = _.slideWidth * _.options.slidesToShow * -1;
                coef = -1;

                if (_.options.vertical === true && _.options.centerMode === true) {
                    if (_.options.slidesToShow === 2) {
                        coef = -1.5;
                    } else if (_.options.slidesToShow === 1) {
                        coef = -2;
                    }
                }
                verticalOffset = verticalHeight * _.options.slidesToShow * coef;
            }
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                if (slideIndex + _.options.slidesToScroll > _.slideCount && _.slideCount > _.options.slidesToShow) {
                    if (slideIndex > _.slideCount) {
                        _.slideOffset = (_.options.slidesToShow - (slideIndex - _.slideCount)) * _.slideWidth * -1;
                        verticalOffset = (_.options.slidesToShow - (slideIndex - _.slideCount)) * verticalHeight * -1;
                    } else {
                        _.slideOffset = _.slideCount % _.options.slidesToScroll * _.slideWidth * -1;
                        verticalOffset = _.slideCount % _.options.slidesToScroll * verticalHeight * -1;
                    }
                }
            }
        } else {
            if (slideIndex + _.options.slidesToShow > _.slideCount) {
                _.slideOffset = (slideIndex + _.options.slidesToShow - _.slideCount) * _.slideWidth;
                verticalOffset = (slideIndex + _.options.slidesToShow - _.slideCount) * verticalHeight;
            }
        }

        if (_.slideCount <= _.options.slidesToShow) {
            _.slideOffset = 0;
            verticalOffset = 0;
        }

        if (_.options.centerMode === true && _.slideCount <= _.options.slidesToShow) {
            _.slideOffset = _.slideWidth * Math.floor(_.options.slidesToShow) / 2 - _.slideWidth * _.slideCount / 2;
        } else if (_.options.centerMode === true && _.options.infinite === true) {
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2) - _.slideWidth;
        } else if (_.options.centerMode === true) {
            _.slideOffset = 0;
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2);
        }

        if (_.options.vertical === false) {
            targetLeft = slideIndex * _.slideWidth * -1 + _.slideOffset;
        } else {
            targetLeft = slideIndex * verticalHeight * -1 + verticalOffset;
        }

        if (_.options.variableWidth === true) {

            if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
                targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
            } else {
                targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow);
            }

            if (_.options.rtl === true) {
                if (targetSlide[0]) {
                    targetLeft = (_.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                } else {
                    targetLeft = 0;
                }
            } else {
                targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
            }

            if (_.options.centerMode === true) {
                if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
                    targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
                } else {
                    targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow + 1);
                }

                if (_.options.rtl === true) {
                    if (targetSlide[0]) {
                        targetLeft = (_.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                    } else {
                        targetLeft = 0;
                    }
                } else {
                    targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
                }

                targetLeft += (_.$list.width() - targetSlide.outerWidth()) / 2;
            }
        }

        return targetLeft;
    };

    Slick.prototype.getOption = Slick.prototype.slickGetOption = function (option) {

        var _ = this;

        return _.options[option];
    };

    Slick.prototype.getNavigableIndexes = function () {

        var _ = this,
            breakPoint = 0,
            counter = 0,
            indexes = [],
            max;

        if (_.options.infinite === false) {
            max = _.slideCount;
        } else {
            breakPoint = _.options.slidesToScroll * -1;
            counter = _.options.slidesToScroll * -1;
            max = _.slideCount * 2;
        }

        while (breakPoint < max) {
            indexes.push(breakPoint);
            breakPoint = counter + _.options.slidesToScroll;
            counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
        }

        return indexes;
    };

    Slick.prototype.getSlick = function () {

        return this;
    };

    Slick.prototype.getSlideCount = function () {

        var _ = this,
            slidesTraversed,
            swipedSlide,
            centerOffset;

        centerOffset = _.options.centerMode === true ? _.slideWidth * Math.floor(_.options.slidesToShow / 2) : 0;

        if (_.options.swipeToSlide === true) {
            _.$slideTrack.find('.slick-slide').each(function (index, slide) {
                if (slide.offsetLeft - centerOffset + $(slide).outerWidth() / 2 > _.swipeLeft * -1) {
                    swipedSlide = slide;
                    return false;
                }
            });

            slidesTraversed = Math.abs($(swipedSlide).attr('data-slick-index') - _.currentSlide) || 1;

            return slidesTraversed;
        } else {
            return _.options.slidesToScroll;
        }
    };

    Slick.prototype.goTo = Slick.prototype.slickGoTo = function (slide, dontAnimate) {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'index',
                index: parseInt(slide)
            }
        }, dontAnimate);
    };

    Slick.prototype.init = function (creation) {

        var _ = this;

        if (!$(_.$slider).hasClass('slick-initialized')) {

            $(_.$slider).addClass('slick-initialized');

            _.buildRows();
            _.buildOut();
            _.setProps();
            _.startLoad();
            _.loadSlider();
            _.initializeEvents();
            _.updateArrows();
            _.updateDots();
            _.checkResponsive(true);
            _.focusHandler();
        }

        if (creation) {
            _.$slider.trigger('init', [_]);
        }

        if (_.options.accessibility === true) {
            _.initADA();
        }

        if (_.options.autoplay) {

            _.paused = false;
            _.autoPlay();
        }
    };

    Slick.prototype.initADA = function () {
        var _ = this,
            numDotGroups = Math.ceil(_.slideCount / _.options.slidesToShow),
            tabControlIndexes = _.getNavigableIndexes().filter(function (val) {
            return val >= 0 && val < _.slideCount;
        });

        _.$slides.add(_.$slideTrack.find('.slick-cloned')).attr({
            'aria-hidden': 'true',
            'tabindex': '-1'
        }).find('a, input, button, select').attr({
            'tabindex': '-1'
        });

        if (_.$dots !== null) {
            _.$slides.not(_.$slideTrack.find('.slick-cloned')).each(function (i) {
                var slideControlIndex = tabControlIndexes.indexOf(i);

                $(this).attr({
                    'role': 'tabpanel',
                    'id': 'slick-slide' + _.instanceUid + i,
                    'tabindex': -1
                });

                if (slideControlIndex !== -1) {
                    var ariaButtonControl = 'slick-slide-control' + _.instanceUid + slideControlIndex;
                    if ($('#' + ariaButtonControl).length) {
                        $(this).attr({
                            'aria-describedby': ariaButtonControl
                        });
                    }
                }
            });

            _.$dots.attr('role', 'tablist').find('li').each(function (i) {
                var mappedSlideIndex = tabControlIndexes[i];

                $(this).attr({
                    'role': 'presentation'
                });

                $(this).find('button').first().attr({
                    'role': 'tab',
                    'id': 'slick-slide-control' + _.instanceUid + i,
                    'aria-controls': 'slick-slide' + _.instanceUid + mappedSlideIndex,
                    'aria-label': i + 1 + ' of ' + numDotGroups,
                    'aria-selected': null,
                    'tabindex': '-1'
                });
            }).eq(_.currentSlide).find('button').attr({
                'aria-selected': 'true',
                'tabindex': '0'
            }).end();
        }

        for (var i = _.currentSlide, max = i + _.options.slidesToShow; i < max; i++) {
            if (_.options.focusOnChange) {
                _.$slides.eq(i).attr({ 'tabindex': '0' });
            } else {
                _.$slides.eq(i).removeAttr('tabindex');
            }
        }

        _.activateADA();
    };

    Slick.prototype.initArrowEvents = function () {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow.off('click.slick').on('click.slick', {
                message: 'previous'
            }, _.changeSlide);
            _.$nextArrow.off('click.slick').on('click.slick', {
                message: 'next'
            }, _.changeSlide);

            if (_.options.accessibility === true) {
                _.$prevArrow.on('keydown.slick', _.keyHandler);
                _.$nextArrow.on('keydown.slick', _.keyHandler);
            }
        }
    };

    Slick.prototype.initDotEvents = function () {

        var _ = this;

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {
            $('li', _.$dots).on('click.slick', {
                message: 'index'
            }, _.changeSlide);

            if (_.options.accessibility === true) {
                _.$dots.on('keydown.slick', _.keyHandler);
            }
        }

        if (_.options.dots === true && _.options.pauseOnDotsHover === true && _.slideCount > _.options.slidesToShow) {

            $('li', _.$dots).on('mouseenter.slick', $.proxy(_.interrupt, _, true)).on('mouseleave.slick', $.proxy(_.interrupt, _, false));
        }
    };

    Slick.prototype.initSlideEvents = function () {

        var _ = this;

        if (_.options.pauseOnHover) {

            _.$list.on('mouseenter.slick', $.proxy(_.interrupt, _, true));
            _.$list.on('mouseleave.slick', $.proxy(_.interrupt, _, false));
        }
    };

    Slick.prototype.initializeEvents = function () {

        var _ = this;

        _.initArrowEvents();

        _.initDotEvents();
        _.initSlideEvents();

        _.$list.on('touchstart.slick mousedown.slick', {
            action: 'start'
        }, _.swipeHandler);
        _.$list.on('touchmove.slick mousemove.slick', {
            action: 'move'
        }, _.swipeHandler);
        _.$list.on('touchend.slick mouseup.slick', {
            action: 'end'
        }, _.swipeHandler);
        _.$list.on('touchcancel.slick mouseleave.slick', {
            action: 'end'
        }, _.swipeHandler);

        _.$list.on('click.slick', _.clickHandler);

        $(document).on(_.visibilityChange, $.proxy(_.visibility, _));

        if (_.options.accessibility === true) {
            _.$list.on('keydown.slick', _.keyHandler);
        }

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on('click.slick', _.selectHandler);
        }

        $(window).on('orientationchange.slick.slick-' + _.instanceUid, $.proxy(_.orientationChange, _));

        $(window).on('resize.slick.slick-' + _.instanceUid, $.proxy(_.resize, _));

        $('[draggable!=true]', _.$slideTrack).on('dragstart', _.preventDefault);

        $(window).on('load.slick.slick-' + _.instanceUid, _.setPosition);
        $(_.setPosition);
    };

    Slick.prototype.initUI = function () {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

            _.$prevArrow.show();
            _.$nextArrow.show();
        }

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$dots.show();
        }
    };

    Slick.prototype.keyHandler = function (event) {

        var _ = this;
        //Dont slide if the cursor is inside the form fields and arrow keys are pressed
        if (!event.target.tagName.match('TEXTAREA|INPUT|SELECT')) {
            if (event.keyCode === 37 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: _.options.rtl === true ? 'next' : 'previous'
                    }
                });
            } else if (event.keyCode === 39 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: _.options.rtl === true ? 'previous' : 'next'
                    }
                });
            }
        }
    };

    Slick.prototype.lazyLoad = function () {

        var _ = this,
            loadRange,
            cloneRange,
            rangeStart,
            rangeEnd;

        function loadImages(imagesScope) {

            $('img[data-lazy]', imagesScope).each(function () {

                var image = $(this),
                    imageSource = $(this).attr('data-lazy'),
                    imageSrcSet = $(this).attr('data-srcset'),
                    imageSizes = $(this).attr('data-sizes') || _.$slider.attr('data-sizes'),
                    imageToLoad = document.createElement('img');

                imageToLoad.onload = function () {

                    image.animate({ opacity: 0 }, 100, function () {

                        if (imageSrcSet) {
                            image.attr('srcset', imageSrcSet);

                            if (imageSizes) {
                                image.attr('sizes', imageSizes);
                            }
                        }

                        image.attr('src', imageSource).animate({ opacity: 1 }, 200, function () {
                            image.removeAttr('data-lazy data-srcset data-sizes').removeClass('slick-loading');
                        });
                        _.$slider.trigger('lazyLoaded', [_, image, imageSource]);
                    });
                };

                imageToLoad.onerror = function () {

                    image.removeAttr('data-lazy').removeClass('slick-loading').addClass('slick-lazyload-error');

                    _.$slider.trigger('lazyLoadError', [_, image, imageSource]);
                };

                imageToLoad.src = imageSource;
            });
        }

        if (_.options.centerMode === true) {
            if (_.options.infinite === true) {
                rangeStart = _.currentSlide + (_.options.slidesToShow / 2 + 1);
                rangeEnd = rangeStart + _.options.slidesToShow + 2;
            } else {
                rangeStart = Math.max(0, _.currentSlide - (_.options.slidesToShow / 2 + 1));
                rangeEnd = 2 + (_.options.slidesToShow / 2 + 1) + _.currentSlide;
            }
        } else {
            rangeStart = _.options.infinite ? _.options.slidesToShow + _.currentSlide : _.currentSlide;
            rangeEnd = Math.ceil(rangeStart + _.options.slidesToShow);
            if (_.options.fade === true) {
                if (rangeStart > 0) rangeStart--;
                if (rangeEnd <= _.slideCount) rangeEnd++;
            }
        }

        loadRange = _.$slider.find('.slick-slide').slice(rangeStart, rangeEnd);

        if (_.options.lazyLoad === 'anticipated') {
            var prevSlide = rangeStart - 1,
                nextSlide = rangeEnd,
                $slides = _.$slider.find('.slick-slide');

            for (var i = 0; i < _.options.slidesToScroll; i++) {
                if (prevSlide < 0) prevSlide = _.slideCount - 1;
                loadRange = loadRange.add($slides.eq(prevSlide));
                loadRange = loadRange.add($slides.eq(nextSlide));
                prevSlide--;
                nextSlide++;
            }
        }

        loadImages(loadRange);

        if (_.slideCount <= _.options.slidesToShow) {
            cloneRange = _.$slider.find('.slick-slide');
            loadImages(cloneRange);
        } else if (_.currentSlide >= _.slideCount - _.options.slidesToShow) {
            cloneRange = _.$slider.find('.slick-cloned').slice(0, _.options.slidesToShow);
            loadImages(cloneRange);
        } else if (_.currentSlide === 0) {
            cloneRange = _.$slider.find('.slick-cloned').slice(_.options.slidesToShow * -1);
            loadImages(cloneRange);
        }
    };

    Slick.prototype.loadSlider = function () {

        var _ = this;

        _.setPosition();

        _.$slideTrack.css({
            opacity: 1
        });

        _.$slider.removeClass('slick-loading');

        _.initUI();

        if (_.options.lazyLoad === 'progressive') {
            _.progressiveLazyLoad();
        }
    };

    Slick.prototype.next = Slick.prototype.slickNext = function () {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'next'
            }
        });
    };

    Slick.prototype.orientationChange = function () {

        var _ = this;

        _.checkResponsive();
        _.setPosition();
    };

    Slick.prototype.pause = Slick.prototype.slickPause = function () {

        var _ = this;

        _.autoPlayClear();
        _.paused = true;
    };

    Slick.prototype.play = Slick.prototype.slickPlay = function () {

        var _ = this;

        _.autoPlay();
        _.options.autoplay = true;
        _.paused = false;
        _.focussed = false;
        _.interrupted = false;
    };

    Slick.prototype.postSlide = function (index) {

        var _ = this;

        if (!_.unslicked) {

            _.$slider.trigger('afterChange', [_, index]);

            _.animating = false;

            if (_.slideCount > _.options.slidesToShow) {
                _.setPosition();
            }

            _.swipeLeft = null;

            if (_.options.autoplay) {
                _.autoPlay();
            }

            if (_.options.accessibility === true) {
                _.initADA();

                if (_.options.focusOnChange) {
                    var $currentSlide = $(_.$slides.get(_.currentSlide));
                    $currentSlide.attr('tabindex', 0).focus();
                }
            }
        }
    };

    Slick.prototype.prev = Slick.prototype.slickPrev = function () {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'previous'
            }
        });
    };

    Slick.prototype.preventDefault = function (event) {

        event.preventDefault();
    };

    Slick.prototype.progressiveLazyLoad = function (tryCount) {

        tryCount = tryCount || 1;

        var _ = this,
            $imgsToLoad = $('img[data-lazy]', _.$slider),
            image,
            imageSource,
            imageSrcSet,
            imageSizes,
            imageToLoad;

        if ($imgsToLoad.length) {

            image = $imgsToLoad.first();
            imageSource = image.attr('data-lazy');
            imageSrcSet = image.attr('data-srcset');
            imageSizes = image.attr('data-sizes') || _.$slider.attr('data-sizes');
            imageToLoad = document.createElement('img');

            imageToLoad.onload = function () {

                if (imageSrcSet) {
                    image.attr('srcset', imageSrcSet);

                    if (imageSizes) {
                        image.attr('sizes', imageSizes);
                    }
                }

                image.attr('src', imageSource).removeAttr('data-lazy data-srcset data-sizes').removeClass('slick-loading');

                if (_.options.adaptiveHeight === true) {
                    _.setPosition();
                }

                _.$slider.trigger('lazyLoaded', [_, image, imageSource]);
                _.progressiveLazyLoad();
            };

            imageToLoad.onerror = function () {

                if (tryCount < 3) {

                    /**
                     * try to load the image 3 times,
                     * leave a slight delay so we don't get
                     * servers blocking the request.
                     */
                    setTimeout(function () {
                        _.progressiveLazyLoad(tryCount + 1);
                    }, 500);
                } else {

                    image.removeAttr('data-lazy').removeClass('slick-loading').addClass('slick-lazyload-error');

                    _.$slider.trigger('lazyLoadError', [_, image, imageSource]);

                    _.progressiveLazyLoad();
                }
            };

            imageToLoad.src = imageSource;
        } else {

            _.$slider.trigger('allImagesLoaded', [_]);
        }
    };

    Slick.prototype.refresh = function (initializing) {

        var _ = this,
            currentSlide,
            lastVisibleIndex;

        lastVisibleIndex = _.slideCount - _.options.slidesToShow;

        // in non-infinite sliders, we don't want to go past the
        // last visible index.
        if (!_.options.infinite && _.currentSlide > lastVisibleIndex) {
            _.currentSlide = lastVisibleIndex;
        }

        // if less slides than to show, go to start.
        if (_.slideCount <= _.options.slidesToShow) {
            _.currentSlide = 0;
        }

        currentSlide = _.currentSlide;

        _.destroy(true);

        $.extend(_, _.initials, { currentSlide: currentSlide });

        _.init();

        if (!initializing) {

            _.changeSlide({
                data: {
                    message: 'index',
                    index: currentSlide
                }
            }, false);
        }
    };

    Slick.prototype.registerBreakpoints = function () {

        var _ = this,
            breakpoint,
            currentBreakpoint,
            l,
            responsiveSettings = _.options.responsive || null;

        if ($.type(responsiveSettings) === 'array' && responsiveSettings.length) {

            _.respondTo = _.options.respondTo || 'window';

            for (breakpoint in responsiveSettings) {

                l = _.breakpoints.length - 1;

                if (responsiveSettings.hasOwnProperty(breakpoint)) {
                    currentBreakpoint = responsiveSettings[breakpoint].breakpoint;

                    // loop through the breakpoints and cut out any existing
                    // ones with the same breakpoint number, we don't want dupes.
                    while (l >= 0) {
                        if (_.breakpoints[l] && _.breakpoints[l] === currentBreakpoint) {
                            _.breakpoints.splice(l, 1);
                        }
                        l--;
                    }

                    _.breakpoints.push(currentBreakpoint);
                    _.breakpointSettings[currentBreakpoint] = responsiveSettings[breakpoint].settings;
                }
            }

            _.breakpoints.sort(function (a, b) {
                return _.options.mobileFirst ? a - b : b - a;
            });
        }
    };

    Slick.prototype.reinit = function () {

        var _ = this;

        _.$slides = _.$slideTrack.children(_.options.slide).addClass('slick-slide');

        _.slideCount = _.$slides.length;

        if (_.currentSlide >= _.slideCount && _.currentSlide !== 0) {
            _.currentSlide = _.currentSlide - _.options.slidesToScroll;
        }

        if (_.slideCount <= _.options.slidesToShow) {
            _.currentSlide = 0;
        }

        _.registerBreakpoints();

        _.setProps();
        _.setupInfinite();
        _.buildArrows();
        _.updateArrows();
        _.initArrowEvents();
        _.buildDots();
        _.updateDots();
        _.initDotEvents();
        _.cleanUpSlideEvents();
        _.initSlideEvents();

        _.checkResponsive(false, true);

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on('click.slick', _.selectHandler);
        }

        _.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);

        _.setPosition();
        _.focusHandler();

        _.paused = !_.options.autoplay;
        _.autoPlay();

        _.$slider.trigger('reInit', [_]);
    };

    Slick.prototype.resize = function () {

        var _ = this;

        if ($(window).width() !== _.windowWidth) {
            clearTimeout(_.windowDelay);
            _.windowDelay = window.setTimeout(function () {
                _.windowWidth = $(window).width();
                _.checkResponsive();
                if (!_.unslicked) {
                    _.setPosition();
                }
            }, 50);
        }
    };

    Slick.prototype.removeSlide = Slick.prototype.slickRemove = function (index, removeBefore, removeAll) {

        var _ = this;

        if (typeof index === 'boolean') {
            removeBefore = index;
            index = removeBefore === true ? 0 : _.slideCount - 1;
        } else {
            index = removeBefore === true ? --index : index;
        }

        if (_.slideCount < 1 || index < 0 || index > _.slideCount - 1) {
            return false;
        }

        _.unload();

        if (removeAll === true) {
            _.$slideTrack.children().remove();
        } else {
            _.$slideTrack.children(this.options.slide).eq(index).remove();
        }

        _.$slides = _.$slideTrack.children(this.options.slide);

        _.$slideTrack.children(this.options.slide).detach();

        _.$slideTrack.append(_.$slides);

        _.$slidesCache = _.$slides;

        _.reinit();
    };

    Slick.prototype.setCSS = function (position) {

        var _ = this,
            positionProps = {},
            x,
            y;

        if (_.options.rtl === true) {
            position = -position;
        }
        x = _.positionProp == 'left' ? Math.ceil(position) + 'px' : '0px';
        y = _.positionProp == 'top' ? Math.ceil(position) + 'px' : '0px';

        positionProps[_.positionProp] = position;

        if (_.transformsEnabled === false) {
            _.$slideTrack.css(positionProps);
        } else {
            positionProps = {};
            if (_.cssTransitions === false) {
                positionProps[_.animType] = 'translate(' + x + ', ' + y + ')';
                _.$slideTrack.css(positionProps);
            } else {
                positionProps[_.animType] = 'translate3d(' + x + ', ' + y + ', 0px)';
                _.$slideTrack.css(positionProps);
            }
        }
    };

    Slick.prototype.setDimensions = function () {

        var _ = this;

        if (_.options.vertical === false) {
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: '0px ' + _.options.centerPadding
                });
            }
        } else {
            _.$list.height(_.$slides.first().outerHeight(true) * _.options.slidesToShow);
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: _.options.centerPadding + ' 0px'
                });
            }
        }

        _.listWidth = _.$list.width();
        _.listHeight = _.$list.height();

        if (_.options.vertical === false && _.options.variableWidth === false) {
            _.slideWidth = Math.ceil(_.listWidth / _.options.slidesToShow);
            _.$slideTrack.width(Math.ceil(_.slideWidth * _.$slideTrack.children('.slick-slide').length));
        } else if (_.options.variableWidth === true) {
            _.$slideTrack.width(5000 * _.slideCount);
        } else {
            _.slideWidth = Math.ceil(_.listWidth);
            _.$slideTrack.height(Math.ceil(_.$slides.first().outerHeight(true) * _.$slideTrack.children('.slick-slide').length));
        }

        var offset = _.$slides.first().outerWidth(true) - _.$slides.first().width();
        if (_.options.variableWidth === false) _.$slideTrack.children('.slick-slide').width(_.slideWidth - offset);
    };

    Slick.prototype.setFade = function () {

        var _ = this,
            targetLeft;

        _.$slides.each(function (index, element) {
            targetLeft = _.slideWidth * index * -1;
            if (_.options.rtl === true) {
                $(element).css({
                    position: 'relative',
                    right: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            } else {
                $(element).css({
                    position: 'relative',
                    left: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            }
        });

        _.$slides.eq(_.currentSlide).css({
            zIndex: _.options.zIndex - 1,
            opacity: 1
        });
    };

    Slick.prototype.setHeight = function () {

        var _ = this;

        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.css('height', targetHeight);
        }
    };

    Slick.prototype.setOption = Slick.prototype.slickSetOption = function () {

        /**
         * accepts arguments in format of:
         *
         *  - for changing a single option's value:
         *     .slick("setOption", option, value, refresh )
         *
         *  - for changing a set of responsive options:
         *     .slick("setOption", 'responsive', [{}, ...], refresh )
         *
         *  - for updating multiple values at once (not responsive)
         *     .slick("setOption", { 'option': value, ... }, refresh )
         */

        var _ = this,
            l,
            item,
            option,
            value,
            refresh = false,
            type;

        if ($.type(arguments[0]) === 'object') {

            option = arguments[0];
            refresh = arguments[1];
            type = 'multiple';
        } else if ($.type(arguments[0]) === 'string') {

            option = arguments[0];
            value = arguments[1];
            refresh = arguments[2];

            if (arguments[0] === 'responsive' && $.type(arguments[1]) === 'array') {

                type = 'responsive';
            } else if (typeof arguments[1] !== 'undefined') {

                type = 'single';
            }
        }

        if (type === 'single') {

            _.options[option] = value;
        } else if (type === 'multiple') {

            $.each(option, function (opt, val) {

                _.options[opt] = val;
            });
        } else if (type === 'responsive') {

            for (item in value) {

                if ($.type(_.options.responsive) !== 'array') {

                    _.options.responsive = [value[item]];
                } else {

                    l = _.options.responsive.length - 1;

                    // loop through the responsive object and splice out duplicates.
                    while (l >= 0) {

                        if (_.options.responsive[l].breakpoint === value[item].breakpoint) {

                            _.options.responsive.splice(l, 1);
                        }

                        l--;
                    }

                    _.options.responsive.push(value[item]);
                }
            }
        }

        if (refresh) {

            _.unload();
            _.reinit();
        }
    };

    Slick.prototype.setPosition = function () {

        var _ = this;

        _.setDimensions();

        _.setHeight();

        if (_.options.fade === false) {
            _.setCSS(_.getLeft(_.currentSlide));
        } else {
            _.setFade();
        }

        _.$slider.trigger('setPosition', [_]);
    };

    Slick.prototype.setProps = function () {

        var _ = this,
            bodyStyle = document.body.style;

        _.positionProp = _.options.vertical === true ? 'top' : 'left';

        if (_.positionProp === 'top') {
            _.$slider.addClass('slick-vertical');
        } else {
            _.$slider.removeClass('slick-vertical');
        }

        if (bodyStyle.WebkitTransition !== undefined || bodyStyle.MozTransition !== undefined || bodyStyle.msTransition !== undefined) {
            if (_.options.useCSS === true) {
                _.cssTransitions = true;
            }
        }

        if (_.options.fade) {
            if (typeof _.options.zIndex === 'number') {
                if (_.options.zIndex < 3) {
                    _.options.zIndex = 3;
                }
            } else {
                _.options.zIndex = _.defaults.zIndex;
            }
        }

        if (bodyStyle.OTransform !== undefined) {
            _.animType = 'OTransform';
            _.transformType = '-o-transform';
            _.transitionType = 'OTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.MozTransform !== undefined) {
            _.animType = 'MozTransform';
            _.transformType = '-moz-transform';
            _.transitionType = 'MozTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.MozPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.webkitTransform !== undefined) {
            _.animType = 'webkitTransform';
            _.transformType = '-webkit-transform';
            _.transitionType = 'webkitTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.msTransform !== undefined) {
            _.animType = 'msTransform';
            _.transformType = '-ms-transform';
            _.transitionType = 'msTransition';
            if (bodyStyle.msTransform === undefined) _.animType = false;
        }
        if (bodyStyle.transform !== undefined && _.animType !== false) {
            _.animType = 'transform';
            _.transformType = 'transform';
            _.transitionType = 'transition';
        }
        _.transformsEnabled = _.options.useTransform && _.animType !== null && _.animType !== false;
    };

    Slick.prototype.setSlideClasses = function (index) {

        var _ = this,
            centerOffset,
            allSlides,
            indexOffset,
            remainder;

        allSlides = _.$slider.find('.slick-slide').removeClass('slick-active slick-center slick-current').attr('aria-hidden', 'true');

        _.$slides.eq(index).addClass('slick-current');

        if (_.options.centerMode === true) {

            var evenCoef = _.options.slidesToShow % 2 === 0 ? 1 : 0;

            centerOffset = Math.floor(_.options.slidesToShow / 2);

            if (_.options.infinite === true) {

                if (index >= centerOffset && index <= _.slideCount - 1 - centerOffset) {
                    _.$slides.slice(index - centerOffset + evenCoef, index + centerOffset + 1).addClass('slick-active').attr('aria-hidden', 'false');
                } else {

                    indexOffset = _.options.slidesToShow + index;
                    allSlides.slice(indexOffset - centerOffset + 1 + evenCoef, indexOffset + centerOffset + 2).addClass('slick-active').attr('aria-hidden', 'false');
                }

                if (index === 0) {

                    allSlides.eq(allSlides.length - 1 - _.options.slidesToShow).addClass('slick-center');
                } else if (index === _.slideCount - 1) {

                    allSlides.eq(_.options.slidesToShow).addClass('slick-center');
                }
            }

            _.$slides.eq(index).addClass('slick-center');
        } else {

            if (index >= 0 && index <= _.slideCount - _.options.slidesToShow) {

                _.$slides.slice(index, index + _.options.slidesToShow).addClass('slick-active').attr('aria-hidden', 'false');
            } else if (allSlides.length <= _.options.slidesToShow) {

                allSlides.addClass('slick-active').attr('aria-hidden', 'false');
            } else {

                remainder = _.slideCount % _.options.slidesToShow;
                indexOffset = _.options.infinite === true ? _.options.slidesToShow + index : index;

                if (_.options.slidesToShow == _.options.slidesToScroll && _.slideCount - index < _.options.slidesToShow) {

                    allSlides.slice(indexOffset - (_.options.slidesToShow - remainder), indexOffset + remainder).addClass('slick-active').attr('aria-hidden', 'false');
                } else {

                    allSlides.slice(indexOffset, indexOffset + _.options.slidesToShow).addClass('slick-active').attr('aria-hidden', 'false');
                }
            }
        }

        if (_.options.lazyLoad === 'ondemand' || _.options.lazyLoad === 'anticipated') {
            _.lazyLoad();
        }
    };

    Slick.prototype.setupInfinite = function () {

        var _ = this,
            i,
            slideIndex,
            infiniteCount;

        if (_.options.fade === true) {
            _.options.centerMode = false;
        }

        if (_.options.infinite === true && _.options.fade === false) {

            slideIndex = null;

            if (_.slideCount > _.options.slidesToShow) {

                if (_.options.centerMode === true) {
                    infiniteCount = _.options.slidesToShow + 1;
                } else {
                    infiniteCount = _.options.slidesToShow;
                }

                for (i = _.slideCount; i > _.slideCount - infiniteCount; i -= 1) {
                    slideIndex = i - 1;
                    $(_.$slides[slideIndex]).clone(true).attr('id', '').attr('data-slick-index', slideIndex - _.slideCount).prependTo(_.$slideTrack).addClass('slick-cloned');
                }
                for (i = 0; i < infiniteCount + _.slideCount; i += 1) {
                    slideIndex = i;
                    $(_.$slides[slideIndex]).clone(true).attr('id', '').attr('data-slick-index', slideIndex + _.slideCount).appendTo(_.$slideTrack).addClass('slick-cloned');
                }
                _.$slideTrack.find('.slick-cloned').find('[id]').each(function () {
                    $(this).attr('id', '');
                });
            }
        }
    };

    Slick.prototype.interrupt = function (toggle) {

        var _ = this;

        if (!toggle) {
            _.autoPlay();
        }
        _.interrupted = toggle;
    };

    Slick.prototype.selectHandler = function (event) {

        var _ = this;

        var targetElement = $(event.target).is('.slick-slide') ? $(event.target) : $(event.target).parents('.slick-slide');

        var index = parseInt(targetElement.attr('data-slick-index'));

        if (!index) index = 0;

        if (_.slideCount <= _.options.slidesToShow) {

            _.slideHandler(index, false, true);
            return;
        }

        _.slideHandler(index);
    };

    Slick.prototype.slideHandler = function (index, sync, dontAnimate) {

        var targetSlide,
            animSlide,
            oldSlide,
            slideLeft,
            targetLeft = null,
            _ = this,
            navTarget;

        sync = sync || false;

        if (_.animating === true && _.options.waitForAnimate === true) {
            return;
        }

        if (_.options.fade === true && _.currentSlide === index) {
            return;
        }

        if (sync === false) {
            _.asNavFor(index);
        }

        targetSlide = index;
        targetLeft = _.getLeft(targetSlide);
        slideLeft = _.getLeft(_.currentSlide);

        _.currentLeft = _.swipeLeft === null ? slideLeft : _.swipeLeft;

        if (_.options.infinite === false && _.options.centerMode === false && (index < 0 || index > _.getDotCount() * _.options.slidesToScroll)) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
                    _.animateSlide(slideLeft, function () {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        } else if (_.options.infinite === false && _.options.centerMode === true && (index < 0 || index > _.slideCount - _.options.slidesToScroll)) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
                    _.animateSlide(slideLeft, function () {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        }

        if (_.options.autoplay) {
            clearInterval(_.autoPlayTimer);
        }

        if (targetSlide < 0) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = _.slideCount - _.slideCount % _.options.slidesToScroll;
            } else {
                animSlide = _.slideCount + targetSlide;
            }
        } else if (targetSlide >= _.slideCount) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = 0;
            } else {
                animSlide = targetSlide - _.slideCount;
            }
        } else {
            animSlide = targetSlide;
        }

        _.animating = true;

        _.$slider.trigger('beforeChange', [_, _.currentSlide, animSlide]);

        oldSlide = _.currentSlide;
        _.currentSlide = animSlide;

        _.setSlideClasses(_.currentSlide);

        if (_.options.asNavFor) {

            navTarget = _.getNavTarget();
            navTarget = navTarget.slick('getSlick');

            if (navTarget.slideCount <= navTarget.options.slidesToShow) {
                navTarget.setSlideClasses(_.currentSlide);
            }
        }

        _.updateDots();
        _.updateArrows();

        if (_.options.fade === true) {
            if (dontAnimate !== true) {

                _.fadeSlideOut(oldSlide);

                _.fadeSlide(animSlide, function () {
                    _.postSlide(animSlide);
                });
            } else {
                _.postSlide(animSlide);
            }
            _.animateHeight();
            return;
        }

        if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
            _.animateSlide(targetLeft, function () {
                _.postSlide(animSlide);
            });
        } else {
            _.postSlide(animSlide);
        }
    };

    Slick.prototype.startLoad = function () {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

            _.$prevArrow.hide();
            _.$nextArrow.hide();
        }

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$dots.hide();
        }

        _.$slider.addClass('slick-loading');
    };

    Slick.prototype.swipeDirection = function () {

        var xDist,
            yDist,
            r,
            swipeAngle,
            _ = this;

        xDist = _.touchObject.startX - _.touchObject.curX;
        yDist = _.touchObject.startY - _.touchObject.curY;
        r = Math.atan2(yDist, xDist);

        swipeAngle = Math.round(r * 180 / Math.PI);
        if (swipeAngle < 0) {
            swipeAngle = 360 - Math.abs(swipeAngle);
        }

        if (swipeAngle <= 45 && swipeAngle >= 0) {
            return _.options.rtl === false ? 'left' : 'right';
        }
        if (swipeAngle <= 360 && swipeAngle >= 315) {
            return _.options.rtl === false ? 'left' : 'right';
        }
        if (swipeAngle >= 135 && swipeAngle <= 225) {
            return _.options.rtl === false ? 'right' : 'left';
        }
        if (_.options.verticalSwiping === true) {
            if (swipeAngle >= 35 && swipeAngle <= 135) {
                return 'down';
            } else {
                return 'up';
            }
        }

        return 'vertical';
    };

    Slick.prototype.swipeEnd = function (event) {

        var _ = this,
            slideCount,
            direction;

        _.dragging = false;
        _.swiping = false;

        if (_.scrolling) {
            _.scrolling = false;
            return false;
        }

        _.interrupted = false;
        _.shouldClick = _.touchObject.swipeLength > 10 ? false : true;

        if (_.touchObject.curX === undefined) {
            return false;
        }

        if (_.touchObject.edgeHit === true) {
            _.$slider.trigger('edge', [_, _.swipeDirection()]);
        }

        if (_.touchObject.swipeLength >= _.touchObject.minSwipe) {

            direction = _.swipeDirection();

            switch (direction) {

                case 'left':
                case 'down':

                    slideCount = _.options.swipeToSlide ? _.checkNavigable(_.currentSlide + _.getSlideCount()) : _.currentSlide + _.getSlideCount();

                    _.currentDirection = 0;

                    break;

                case 'right':
                case 'up':

                    slideCount = _.options.swipeToSlide ? _.checkNavigable(_.currentSlide - _.getSlideCount()) : _.currentSlide - _.getSlideCount();

                    _.currentDirection = 1;

                    break;

                default:

            }

            if (direction != 'vertical') {

                _.slideHandler(slideCount);
                _.touchObject = {};
                _.$slider.trigger('swipe', [_, direction]);
            }
        } else {

            if (_.touchObject.startX !== _.touchObject.curX) {

                _.slideHandler(_.currentSlide);
                _.touchObject = {};
            }
        }
    };

    Slick.prototype.swipeHandler = function (event) {

        var _ = this;

        if (_.options.swipe === false || 'ontouchend' in document && _.options.swipe === false) {
            return;
        } else if (_.options.draggable === false && event.type.indexOf('mouse') !== -1) {
            return;
        }

        _.touchObject.fingerCount = event.originalEvent && event.originalEvent.touches !== undefined ? event.originalEvent.touches.length : 1;

        _.touchObject.minSwipe = _.listWidth / _.options.touchThreshold;

        if (_.options.verticalSwiping === true) {
            _.touchObject.minSwipe = _.listHeight / _.options.touchThreshold;
        }

        switch (event.data.action) {

            case 'start':
                _.swipeStart(event);
                break;

            case 'move':
                _.swipeMove(event);
                break;

            case 'end':
                _.swipeEnd(event);
                break;

        }
    };

    Slick.prototype.swipeMove = function (event) {

        var _ = this,
            edgeWasHit = false,
            curLeft,
            swipeDirection,
            swipeLength,
            positionOffset,
            touches,
            verticalSwipeLength;

        touches = event.originalEvent !== undefined ? event.originalEvent.touches : null;

        if (!_.dragging || _.scrolling || touches && touches.length !== 1) {
            return false;
        }

        curLeft = _.getLeft(_.currentSlide);

        _.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
        _.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;

        _.touchObject.swipeLength = Math.round(Math.sqrt(Math.pow(_.touchObject.curX - _.touchObject.startX, 2)));

        verticalSwipeLength = Math.round(Math.sqrt(Math.pow(_.touchObject.curY - _.touchObject.startY, 2)));

        if (!_.options.verticalSwiping && !_.swiping && verticalSwipeLength > 4) {
            _.scrolling = true;
            return false;
        }

        if (_.options.verticalSwiping === true) {
            _.touchObject.swipeLength = verticalSwipeLength;
        }

        swipeDirection = _.swipeDirection();

        if (event.originalEvent !== undefined && _.touchObject.swipeLength > 4) {
            _.swiping = true;
            event.preventDefault();
        }

        positionOffset = (_.options.rtl === false ? 1 : -1) * (_.touchObject.curX > _.touchObject.startX ? 1 : -1);
        if (_.options.verticalSwiping === true) {
            positionOffset = _.touchObject.curY > _.touchObject.startY ? 1 : -1;
        }

        swipeLength = _.touchObject.swipeLength;

        _.touchObject.edgeHit = false;

        if (_.options.infinite === false) {
            if (_.currentSlide === 0 && swipeDirection === 'right' || _.currentSlide >= _.getDotCount() && swipeDirection === 'left') {
                swipeLength = _.touchObject.swipeLength * _.options.edgeFriction;
                _.touchObject.edgeHit = true;
            }
        }

        if (_.options.vertical === false) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        } else {
            _.swipeLeft = curLeft + swipeLength * (_.$list.height() / _.listWidth) * positionOffset;
        }
        if (_.options.verticalSwiping === true) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        }

        if (_.options.fade === true || _.options.touchMove === false) {
            return false;
        }

        if (_.animating === true) {
            _.swipeLeft = null;
            return false;
        }

        _.setCSS(_.swipeLeft);
    };

    Slick.prototype.swipeStart = function (event) {

        var _ = this,
            touches;

        _.interrupted = true;

        if (_.touchObject.fingerCount !== 1 || _.slideCount <= _.options.slidesToShow) {
            _.touchObject = {};
            return false;
        }

        if (event.originalEvent !== undefined && event.originalEvent.touches !== undefined) {
            touches = event.originalEvent.touches[0];
        }

        _.touchObject.startX = _.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
        _.touchObject.startY = _.touchObject.curY = touches !== undefined ? touches.pageY : event.clientY;

        _.dragging = true;
    };

    Slick.prototype.unfilterSlides = Slick.prototype.slickUnfilter = function () {

        var _ = this;

        if (_.$slidesCache !== null) {

            _.unload();

            _.$slideTrack.children(this.options.slide).detach();

            _.$slidesCache.appendTo(_.$slideTrack);

            _.reinit();
        }
    };

    Slick.prototype.unload = function () {

        var _ = this;

        $('.slick-cloned', _.$slider).remove();

        if (_.$dots) {
            _.$dots.remove();
        }

        if (_.$prevArrow && _.htmlExpr.test(_.options.prevArrow)) {
            _.$prevArrow.remove();
        }

        if (_.$nextArrow && _.htmlExpr.test(_.options.nextArrow)) {
            _.$nextArrow.remove();
        }

        _.$slides.removeClass('slick-slide slick-active slick-visible slick-current').attr('aria-hidden', 'true').css('width', '');
    };

    Slick.prototype.unslick = function (fromBreakpoint) {

        var _ = this;
        _.$slider.trigger('unslick', [_, fromBreakpoint]);
        _.destroy();
    };

    Slick.prototype.updateArrows = function () {

        var _ = this,
            centerOffset;

        centerOffset = Math.floor(_.options.slidesToShow / 2);

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow && !_.options.infinite) {

            _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');
            _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            if (_.currentSlide === 0) {

                _.$prevArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');
            } else if (_.currentSlide >= _.slideCount - _.options.slidesToShow && _.options.centerMode === false) {

                _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');
            } else if (_.currentSlide >= _.slideCount - 1 && _.options.centerMode === true) {

                _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');
            }
        }
    };

    Slick.prototype.updateDots = function () {

        var _ = this;

        if (_.$dots !== null) {

            _.$dots.find('li').removeClass('slick-active').end();

            _.$dots.find('li').eq(Math.floor(_.currentSlide / _.options.slidesToScroll)).addClass('slick-active');
        }
    };

    Slick.prototype.visibility = function () {

        var _ = this;

        if (_.options.autoplay) {

            if (document[_.hidden]) {

                _.interrupted = true;
            } else {

                _.interrupted = false;
            }
        }
    };

    $.fn.slick = function () {
        var _ = this,
            opt = arguments[0],
            args = Array.prototype.slice.call(arguments, 1),
            l = _.length,
            i,
            ret;
        for (i = 0; i < l; i++) {
            if ((typeof opt === 'undefined' ? 'undefined' : _typeof(opt)) == 'object' || typeof opt == 'undefined') _[i].slick = new Slick(_[i], opt);else ret = _[i].slick[opt].apply(_[i].slick, args);
            if (typeof ret != 'undefined') return ret;
        }
        return _;
    };
});
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*!
 * jQuery Validation Plugin v1.19.1
 *
 * https://jqueryvalidation.org/
 *
 * Copyright (c) 2019 Jörn Zaefferer
 * Released under the MIT license
 */
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["jquery"], factory);
	} else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && module.exports) {
		module.exports = factory(require("jquery"));
	} else {
		factory(jQuery);
	}
})(function ($) {

	$.extend($.fn, {

		// https://jqueryvalidation.org/validate/
		validate: function validate(options) {

			// If nothing is selected, return nothing; can't chain anyway
			if (!this.length) {
				if (options && options.debug && window.console) {
					console.warn("Nothing selected, can't validate, returning nothing.");
				}
				return;
			}

			// Check if a validator for this form was already created
			var validator = $.data(this[0], "validator");
			if (validator) {
				return validator;
			}

			// Add novalidate tag if HTML5.
			this.attr("novalidate", "novalidate");

			validator = new $.validator(options, this[0]);
			$.data(this[0], "validator", validator);

			if (validator.settings.onsubmit) {

				this.on("click.validate", ":submit", function (event) {

					// Track the used submit button to properly handle scripted
					// submits later.
					validator.submitButton = event.currentTarget;

					// Allow suppressing validation by adding a cancel class to the submit button
					if ($(this).hasClass("cancel")) {
						validator.cancelSubmit = true;
					}

					// Allow suppressing validation by adding the html5 formnovalidate attribute to the submit button
					if ($(this).attr("formnovalidate") !== undefined) {
						validator.cancelSubmit = true;
					}
				});

				// Validate the form on submit
				this.on("submit.validate", function (event) {
					if (validator.settings.debug) {

						// Prevent form submit to be able to see console output
						event.preventDefault();
					}

					function handle() {
						var hidden, result;

						// Insert a hidden input as a replacement for the missing submit button
						// The hidden input is inserted in two cases:
						//   - A user defined a `submitHandler`
						//   - There was a pending request due to `remote` method and `stopRequest()`
						//     was called to submit the form in case it's valid
						if (validator.submitButton && (validator.settings.submitHandler || validator.formSubmitted)) {
							hidden = $("<input type='hidden'/>").attr("name", validator.submitButton.name).val($(validator.submitButton).val()).appendTo(validator.currentForm);
						}

						if (validator.settings.submitHandler && !validator.settings.debug) {
							result = validator.settings.submitHandler.call(validator, validator.currentForm, event);
							if (hidden) {

								// And clean up afterwards; thanks to no-block-scope, hidden can be referenced
								hidden.remove();
							}
							if (result !== undefined) {
								return result;
							}
							return false;
						}
						return true;
					}

					// Prevent submit for invalid forms or custom submit handlers
					if (validator.cancelSubmit) {
						validator.cancelSubmit = false;
						return handle();
					}
					if (validator.form()) {
						if (validator.pendingRequest) {
							validator.formSubmitted = true;
							return false;
						}
						return handle();
					} else {
						validator.focusInvalid();
						return false;
					}
				});
			}

			return validator;
		},

		// https://jqueryvalidation.org/valid/
		valid: function valid() {
			var valid, validator, errorList;

			if ($(this[0]).is("form")) {
				valid = this.validate().form();
			} else {
				errorList = [];
				valid = true;
				validator = $(this[0].form).validate();
				this.each(function () {
					valid = validator.element(this) && valid;
					if (!valid) {
						errorList = errorList.concat(validator.errorList);
					}
				});
				validator.errorList = errorList;
			}
			return valid;
		},

		// https://jqueryvalidation.org/rules/
		rules: function rules(command, argument) {
			var element = this[0],
			    isContentEditable = typeof this.attr("contenteditable") !== "undefined" && this.attr("contenteditable") !== "false",
			    settings,
			    staticRules,
			    existingRules,
			    data,
			    param,
			    filtered;

			// If nothing is selected, return empty object; can't chain anyway
			if (element == null) {
				return;
			}

			if (!element.form && isContentEditable) {
				element.form = this.closest("form")[0];
				element.name = this.attr("name");
			}

			if (element.form == null) {
				return;
			}

			if (command) {
				settings = $.data(element.form, "validator").settings;
				staticRules = settings.rules;
				existingRules = $.validator.staticRules(element);
				switch (command) {
					case "add":
						$.extend(existingRules, $.validator.normalizeRule(argument));

						// Remove messages from rules, but allow them to be set separately
						delete existingRules.messages;
						staticRules[element.name] = existingRules;
						if (argument.messages) {
							settings.messages[element.name] = $.extend(settings.messages[element.name], argument.messages);
						}
						break;
					case "remove":
						if (!argument) {
							delete staticRules[element.name];
							return existingRules;
						}
						filtered = {};
						$.each(argument.split(/\s/), function (index, method) {
							filtered[method] = existingRules[method];
							delete existingRules[method];
						});
						return filtered;
				}
			}

			data = $.validator.normalizeRules($.extend({}, $.validator.classRules(element), $.validator.attributeRules(element), $.validator.dataRules(element), $.validator.staticRules(element)), element);

			// Make sure required is at front
			if (data.required) {
				param = data.required;
				delete data.required;
				data = $.extend({ required: param }, data);
			}

			// Make sure remote is at back
			if (data.remote) {
				param = data.remote;
				delete data.remote;
				data = $.extend(data, { remote: param });
			}

			return data;
		}
	});

	// Custom selectors
	$.extend($.expr.pseudos || $.expr[":"], { // '|| $.expr[ ":" ]' here enables backwards compatibility to jQuery 1.7. Can be removed when dropping jQ 1.7.x support

		// https://jqueryvalidation.org/blank-selector/
		blank: function blank(a) {
			return !$.trim("" + $(a).val());
		},

		// https://jqueryvalidation.org/filled-selector/
		filled: function filled(a) {
			var val = $(a).val();
			return val !== null && !!$.trim("" + val);
		},

		// https://jqueryvalidation.org/unchecked-selector/
		unchecked: function unchecked(a) {
			return !$(a).prop("checked");
		}
	});

	// Constructor for validator
	$.validator = function (options, form) {
		this.settings = $.extend(true, {}, $.validator.defaults, options);
		this.currentForm = form;
		this.init();
	};

	// https://jqueryvalidation.org/jQuery.validator.format/
	$.validator.format = function (source, params) {
		if (arguments.length === 1) {
			return function () {
				var args = $.makeArray(arguments);
				args.unshift(source);
				return $.validator.format.apply(this, args);
			};
		}
		if (params === undefined) {
			return source;
		}
		if (arguments.length > 2 && params.constructor !== Array) {
			params = $.makeArray(arguments).slice(1);
		}
		if (params.constructor !== Array) {
			params = [params];
		}
		$.each(params, function (i, n) {
			source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function () {
				return n;
			});
		});
		return source;
	};

	$.extend($.validator, {

		defaults: {
			messages: {},
			groups: {},
			rules: {},
			errorClass: "error",
			pendingClass: "pending",
			validClass: "valid",
			errorElement: "label",
			focusCleanup: false,
			focusInvalid: true,
			errorContainer: $([]),
			errorLabelContainer: $([]),
			onsubmit: true,
			ignore: ":hidden",
			ignoreTitle: false,
			onfocusin: function onfocusin(element) {
				this.lastActive = element;

				// Hide error label and remove error class on focus if enabled
				if (this.settings.focusCleanup) {
					if (this.settings.unhighlight) {
						this.settings.unhighlight.call(this, element, this.settings.errorClass, this.settings.validClass);
					}
					this.hideThese(this.errorsFor(element));
				}
			},
			onfocusout: function onfocusout(element) {
				if (!this.checkable(element) && (element.name in this.submitted || !this.optional(element))) {
					this.element(element);
				}
			},
			onkeyup: function onkeyup(element, event) {

				// Avoid revalidate the field when pressing one of the following keys
				// Shift       => 16
				// Ctrl        => 17
				// Alt         => 18
				// Caps lock   => 20
				// End         => 35
				// Home        => 36
				// Left arrow  => 37
				// Up arrow    => 38
				// Right arrow => 39
				// Down arrow  => 40
				// Insert      => 45
				// Num lock    => 144
				// AltGr key   => 225
				var excludedKeys = [16, 17, 18, 20, 35, 36, 37, 38, 39, 40, 45, 144, 225];

				if (event.which === 9 && this.elementValue(element) === "" || $.inArray(event.keyCode, excludedKeys) !== -1) {
					return;
				} else if (element.name in this.submitted || element.name in this.invalid) {
					this.element(element);
				}
			},
			onclick: function onclick(element) {

				// Click on selects, radiobuttons and checkboxes
				if (element.name in this.submitted) {
					this.element(element);

					// Or option elements, check parent select in that case
				} else if (element.parentNode.name in this.submitted) {
					this.element(element.parentNode);
				}
			},
			highlight: function highlight(element, errorClass, validClass) {
				if (element.type === "radio") {
					this.findByName(element.name).addClass(errorClass).removeClass(validClass);
				} else {
					$(element).addClass(errorClass).removeClass(validClass);
				}
			},
			unhighlight: function unhighlight(element, errorClass, validClass) {
				if (element.type === "radio") {
					this.findByName(element.name).removeClass(errorClass).addClass(validClass);
				} else {
					$(element).removeClass(errorClass).addClass(validClass);
				}
			}
		},

		// https://jqueryvalidation.org/jQuery.validator.setDefaults/
		setDefaults: function setDefaults(settings) {
			$.extend($.validator.defaults, settings);
		},

		messages: {
			required: "This field is required.",
			remote: "Please fix this field.",
			email: "Please enter a valid email address.",
			url: "Please enter a valid URL.",
			date: "Please enter a valid date.",
			dateISO: "Please enter a valid date (ISO).",
			number: "Please enter a valid number.",
			digits: "Please enter only digits.",
			equalTo: "Please enter the same value again.",
			maxlength: $.validator.format("Please enter no more than {0} characters."),
			minlength: $.validator.format("Please enter at least {0} characters."),
			rangelength: $.validator.format("Please enter a value between {0} and {1} characters long."),
			range: $.validator.format("Please enter a value between {0} and {1}."),
			max: $.validator.format("Please enter a value less than or equal to {0}."),
			min: $.validator.format("Please enter a value greater than or equal to {0}."),
			step: $.validator.format("Please enter a multiple of {0}.")
		},

		autoCreateRanges: false,

		prototype: {

			init: function init() {
				this.labelContainer = $(this.settings.errorLabelContainer);
				this.errorContext = this.labelContainer.length && this.labelContainer || $(this.currentForm);
				this.containers = $(this.settings.errorContainer).add(this.settings.errorLabelContainer);
				this.submitted = {};
				this.valueCache = {};
				this.pendingRequest = 0;
				this.pending = {};
				this.invalid = {};
				this.reset();

				var currentForm = this.currentForm,
				    groups = this.groups = {},
				    rules;
				$.each(this.settings.groups, function (key, value) {
					if (typeof value === "string") {
						value = value.split(/\s/);
					}
					$.each(value, function (index, name) {
						groups[name] = key;
					});
				});
				rules = this.settings.rules;
				$.each(rules, function (key, value) {
					rules[key] = $.validator.normalizeRule(value);
				});

				function delegate(event) {
					var isContentEditable = typeof $(this).attr("contenteditable") !== "undefined" && $(this).attr("contenteditable") !== "false";

					// Set form expando on contenteditable
					if (!this.form && isContentEditable) {
						this.form = $(this).closest("form")[0];
						this.name = $(this).attr("name");
					}

					// Ignore the element if it belongs to another form. This will happen mainly
					// when setting the `form` attribute of an input to the id of another form.
					if (currentForm !== this.form) {
						return;
					}

					var validator = $.data(this.form, "validator"),
					    eventType = "on" + event.type.replace(/^validate/, ""),
					    settings = validator.settings;
					if (settings[eventType] && !$(this).is(settings.ignore)) {
						settings[eventType].call(validator, this, event);
					}
				}

				$(this.currentForm).on("focusin.validate focusout.validate keyup.validate", ":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'], " + "[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], " + "[type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], " + "[type='radio'], [type='checkbox'], [contenteditable], [type='button']", delegate)

				// Support: Chrome, oldIE
				// "select" is provided as event.target when clicking a option
				.on("click.validate", "select, option, [type='radio'], [type='checkbox']", delegate);

				if (this.settings.invalidHandler) {
					$(this.currentForm).on("invalid-form.validate", this.settings.invalidHandler);
				}
			},

			// https://jqueryvalidation.org/Validator.form/
			form: function form() {
				this.checkForm();
				$.extend(this.submitted, this.errorMap);
				this.invalid = $.extend({}, this.errorMap);
				if (!this.valid()) {
					$(this.currentForm).triggerHandler("invalid-form", [this]);
				}
				this.showErrors();
				return this.valid();
			},

			checkForm: function checkForm() {
				this.prepareForm();
				for (var i = 0, elements = this.currentElements = this.elements(); elements[i]; i++) {
					this.check(elements[i]);
				}
				return this.valid();
			},

			// https://jqueryvalidation.org/Validator.element/
			element: function element(_element) {
				var cleanElement = this.clean(_element),
				    checkElement = this.validationTargetFor(cleanElement),
				    v = this,
				    result = true,
				    rs,
				    group;

				if (checkElement === undefined) {
					delete this.invalid[cleanElement.name];
				} else {
					this.prepareElement(checkElement);
					this.currentElements = $(checkElement);

					// If this element is grouped, then validate all group elements already
					// containing a value
					group = this.groups[checkElement.name];
					if (group) {
						$.each(this.groups, function (name, testgroup) {
							if (testgroup === group && name !== checkElement.name) {
								cleanElement = v.validationTargetFor(v.clean(v.findByName(name)));
								if (cleanElement && cleanElement.name in v.invalid) {
									v.currentElements.push(cleanElement);
									result = v.check(cleanElement) && result;
								}
							}
						});
					}

					rs = this.check(checkElement) !== false;
					result = result && rs;
					if (rs) {
						this.invalid[checkElement.name] = false;
					} else {
						this.invalid[checkElement.name] = true;
					}

					if (!this.numberOfInvalids()) {

						// Hide error containers on last error
						this.toHide = this.toHide.add(this.containers);
					}
					this.showErrors();

					// Add aria-invalid status for screen readers
					$(_element).attr("aria-invalid", !rs);
				}

				return result;
			},

			// https://jqueryvalidation.org/Validator.showErrors/
			showErrors: function showErrors(errors) {
				if (errors) {
					var validator = this;

					// Add items to error list and map
					$.extend(this.errorMap, errors);
					this.errorList = $.map(this.errorMap, function (message, name) {
						return {
							message: message,
							element: validator.findByName(name)[0]
						};
					});

					// Remove items from success list
					this.successList = $.grep(this.successList, function (element) {
						return !(element.name in errors);
					});
				}
				if (this.settings.showErrors) {
					this.settings.showErrors.call(this, this.errorMap, this.errorList);
				} else {
					this.defaultShowErrors();
				}
			},

			// https://jqueryvalidation.org/Validator.resetForm/
			resetForm: function resetForm() {
				if ($.fn.resetForm) {
					$(this.currentForm).resetForm();
				}
				this.invalid = {};
				this.submitted = {};
				this.prepareForm();
				this.hideErrors();
				var elements = this.elements().removeData("previousValue").removeAttr("aria-invalid");

				this.resetElements(elements);
			},

			resetElements: function resetElements(elements) {
				var i;

				if (this.settings.unhighlight) {
					for (i = 0; elements[i]; i++) {
						this.settings.unhighlight.call(this, elements[i], this.settings.errorClass, "");
						this.findByName(elements[i].name).removeClass(this.settings.validClass);
					}
				} else {
					elements.removeClass(this.settings.errorClass).removeClass(this.settings.validClass);
				}
			},

			numberOfInvalids: function numberOfInvalids() {
				return this.objectLength(this.invalid);
			},

			objectLength: function objectLength(obj) {
				/* jshint unused: false */
				var count = 0,
				    i;
				for (i in obj) {

					// This check allows counting elements with empty error
					// message as invalid elements
					if (obj[i] !== undefined && obj[i] !== null && obj[i] !== false) {
						count++;
					}
				}
				return count;
			},

			hideErrors: function hideErrors() {
				this.hideThese(this.toHide);
			},

			hideThese: function hideThese(errors) {
				errors.not(this.containers).text("");
				this.addWrapper(errors).hide();
			},

			valid: function valid() {
				return this.size() === 0;
			},

			size: function size() {
				return this.errorList.length;
			},

			focusInvalid: function focusInvalid() {
				if (this.settings.focusInvalid) {
					try {
						$(this.findLastActive() || this.errorList.length && this.errorList[0].element || []).filter(":visible").trigger("focus")

						// Manually trigger focusin event; without it, focusin handler isn't called, findLastActive won't have anything to find
						.trigger("focusin");
					} catch (e) {

						// Ignore IE throwing errors when focusing hidden elements
					}
				}
			},

			findLastActive: function findLastActive() {
				var lastActive = this.lastActive;
				return lastActive && $.grep(this.errorList, function (n) {
					return n.element.name === lastActive.name;
				}).length === 1 && lastActive;
			},

			elements: function elements() {
				var validator = this,
				    rulesCache = {};

				// Select all valid inputs inside the form (no submit or reset buttons)
				return $(this.currentForm).find("input, select, textarea, [contenteditable]").not(":submit, :reset, :image, :disabled").not(this.settings.ignore).filter(function () {
					var name = this.name || $(this).attr("name"); // For contenteditable
					var isContentEditable = typeof $(this).attr("contenteditable") !== "undefined" && $(this).attr("contenteditable") !== "false";

					if (!name && validator.settings.debug && window.console) {
						console.error("%o has no name assigned", this);
					}

					// Set form expando on contenteditable
					if (isContentEditable) {
						this.form = $(this).closest("form")[0];
						this.name = name;
					}

					// Ignore elements that belong to other/nested forms
					if (this.form !== validator.currentForm) {
						return false;
					}

					// Select only the first element for each name, and only those with rules specified
					if (name in rulesCache || !validator.objectLength($(this).rules())) {
						return false;
					}

					rulesCache[name] = true;
					return true;
				});
			},

			clean: function clean(selector) {
				return $(selector)[0];
			},

			errors: function errors() {
				var errorClass = this.settings.errorClass.split(" ").join(".");
				return $(this.settings.errorElement + "." + errorClass, this.errorContext);
			},

			resetInternals: function resetInternals() {
				this.successList = [];
				this.errorList = [];
				this.errorMap = {};
				this.toShow = $([]);
				this.toHide = $([]);
			},

			reset: function reset() {
				this.resetInternals();
				this.currentElements = $([]);
			},

			prepareForm: function prepareForm() {
				this.reset();
				this.toHide = this.errors().add(this.containers);
			},

			prepareElement: function prepareElement(element) {
				this.reset();
				this.toHide = this.errorsFor(element);
			},

			elementValue: function elementValue(element) {
				var $element = $(element),
				    type = element.type,
				    isContentEditable = typeof $element.attr("contenteditable") !== "undefined" && $element.attr("contenteditable") !== "false",
				    val,
				    idx;

				if (type === "radio" || type === "checkbox") {
					return this.findByName(element.name).filter(":checked").val();
				} else if (type === "number" && typeof element.validity !== "undefined") {
					return element.validity.badInput ? "NaN" : $element.val();
				}

				if (isContentEditable) {
					val = $element.text();
				} else {
					val = $element.val();
				}

				if (type === "file") {

					// Modern browser (chrome & safari)
					if (val.substr(0, 12) === "C:\\fakepath\\") {
						return val.substr(12);
					}

					// Legacy browsers
					// Unix-based path
					idx = val.lastIndexOf("/");
					if (idx >= 0) {
						return val.substr(idx + 1);
					}

					// Windows-based path
					idx = val.lastIndexOf("\\");
					if (idx >= 0) {
						return val.substr(idx + 1);
					}

					// Just the file name
					return val;
				}

				if (typeof val === "string") {
					return val.replace(/\r/g, "");
				}
				return val;
			},

			check: function check(element) {
				element = this.validationTargetFor(this.clean(element));

				var rules = $(element).rules(),
				    rulesCount = $.map(rules, function (n, i) {
					return i;
				}).length,
				    dependencyMismatch = false,
				    val = this.elementValue(element),
				    result,
				    method,
				    rule,
				    normalizer;

				// Prioritize the local normalizer defined for this element over the global one
				// if the former exists, otherwise user the global one in case it exists.
				if (typeof rules.normalizer === "function") {
					normalizer = rules.normalizer;
				} else if (typeof this.settings.normalizer === "function") {
					normalizer = this.settings.normalizer;
				}

				// If normalizer is defined, then call it to retreive the changed value instead
				// of using the real one.
				// Note that `this` in the normalizer is `element`.
				if (normalizer) {
					val = normalizer.call(element, val);

					// Delete the normalizer from rules to avoid treating it as a pre-defined method.
					delete rules.normalizer;
				}

				for (method in rules) {
					rule = { method: method, parameters: rules[method] };
					try {
						result = $.validator.methods[method].call(this, val, element, rule.parameters);

						// If a method indicates that the field is optional and therefore valid,
						// don't mark it as valid when there are no other rules
						if (result === "dependency-mismatch" && rulesCount === 1) {
							dependencyMismatch = true;
							continue;
						}
						dependencyMismatch = false;

						if (result === "pending") {
							this.toHide = this.toHide.not(this.errorsFor(element));
							return;
						}

						if (!result) {
							this.formatAndAdd(element, rule);
							return false;
						}
					} catch (e) {
						if (this.settings.debug && window.console) {
							console.log("Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.", e);
						}
						if (e instanceof TypeError) {
							e.message += ".  Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.";
						}

						throw e;
					}
				}
				if (dependencyMismatch) {
					return;
				}
				if (this.objectLength(rules)) {
					this.successList.push(element);
				}
				return true;
			},

			// Return the custom message for the given element and validation method
			// specified in the element's HTML5 data attribute
			// return the generic message if present and no method specific message is present
			customDataMessage: function customDataMessage(element, method) {
				return $(element).data("msg" + method.charAt(0).toUpperCase() + method.substring(1).toLowerCase()) || $(element).data("msg");
			},

			// Return the custom message for the given element name and validation method
			customMessage: function customMessage(name, method) {
				var m = this.settings.messages[name];
				return m && (m.constructor === String ? m : m[method]);
			},

			// Return the first defined argument, allowing empty strings
			findDefined: function findDefined() {
				for (var i = 0; i < arguments.length; i++) {
					if (arguments[i] !== undefined) {
						return arguments[i];
					}
				}
				return undefined;
			},

			// The second parameter 'rule' used to be a string, and extended to an object literal
			// of the following form:
			// rule = {
			//     method: "method name",
			//     parameters: "the given method parameters"
			// }
			//
			// The old behavior still supported, kept to maintain backward compatibility with
			// old code, and will be removed in the next major release.
			defaultMessage: function defaultMessage(element, rule) {
				if (typeof rule === "string") {
					rule = { method: rule };
				}

				var message = this.findDefined(this.customMessage(element.name, rule.method), this.customDataMessage(element, rule.method),

				// 'title' is never undefined, so handle empty string as undefined
				!this.settings.ignoreTitle && element.title || undefined, $.validator.messages[rule.method], "<strong>Warning: No message defined for " + element.name + "</strong>"),
				    theregex = /\$?\{(\d+)\}/g;
				if (typeof message === "function") {
					message = message.call(this, rule.parameters, element);
				} else if (theregex.test(message)) {
					message = $.validator.format(message.replace(theregex, "{$1}"), rule.parameters);
				}

				return message;
			},

			formatAndAdd: function formatAndAdd(element, rule) {
				var message = this.defaultMessage(element, rule);

				this.errorList.push({
					message: message,
					element: element,
					method: rule.method
				});

				this.errorMap[element.name] = message;
				this.submitted[element.name] = message;
			},

			addWrapper: function addWrapper(toToggle) {
				if (this.settings.wrapper) {
					toToggle = toToggle.add(toToggle.parent(this.settings.wrapper));
				}
				return toToggle;
			},

			defaultShowErrors: function defaultShowErrors() {
				var i, elements, error;
				for (i = 0; this.errorList[i]; i++) {
					error = this.errorList[i];
					if (this.settings.highlight) {
						this.settings.highlight.call(this, error.element, this.settings.errorClass, this.settings.validClass);
					}
					this.showLabel(error.element, error.message);
				}
				if (this.errorList.length) {
					this.toShow = this.toShow.add(this.containers);
				}
				if (this.settings.success) {
					for (i = 0; this.successList[i]; i++) {
						this.showLabel(this.successList[i]);
					}
				}
				if (this.settings.unhighlight) {
					for (i = 0, elements = this.validElements(); elements[i]; i++) {
						this.settings.unhighlight.call(this, elements[i], this.settings.errorClass, this.settings.validClass);
					}
				}
				this.toHide = this.toHide.not(this.toShow);
				this.hideErrors();
				this.addWrapper(this.toShow).show();
			},

			validElements: function validElements() {
				return this.currentElements.not(this.invalidElements());
			},

			invalidElements: function invalidElements() {
				return $(this.errorList).map(function () {
					return this.element;
				});
			},

			showLabel: function showLabel(element, message) {
				var place,
				    group,
				    errorID,
				    v,
				    error = this.errorsFor(element),
				    elementID = this.idOrName(element),
				    describedBy = $(element).attr("aria-describedby");

				if (error.length) {

					// Refresh error/success class
					error.removeClass(this.settings.validClass).addClass(this.settings.errorClass);

					// Replace message on existing label
					error.html(message);
				} else {

					// Create error element
					error = $("<" + this.settings.errorElement + ">").attr("id", elementID + "-error").addClass(this.settings.errorClass).html(message || "");

					// Maintain reference to the element to be placed into the DOM
					place = error;
					if (this.settings.wrapper) {

						// Make sure the element is visible, even in IE
						// actually showing the wrapped element is handled elsewhere
						place = error.hide().show().wrap("<" + this.settings.wrapper + "/>").parent();
					}
					if (this.labelContainer.length) {
						this.labelContainer.append(place);
					} else if (this.settings.errorPlacement) {
						this.settings.errorPlacement.call(this, place, $(element));
					} else {
						place.insertAfter(element);
					}

					// Link error back to the element
					if (error.is("label")) {

						// If the error is a label, then associate using 'for'
						error.attr("for", elementID);

						// If the element is not a child of an associated label, then it's necessary
						// to explicitly apply aria-describedby
					} else if (error.parents("label[for='" + this.escapeCssMeta(elementID) + "']").length === 0) {
						errorID = error.attr("id");

						// Respect existing non-error aria-describedby
						if (!describedBy) {
							describedBy = errorID;
						} else if (!describedBy.match(new RegExp("\\b" + this.escapeCssMeta(errorID) + "\\b"))) {

							// Add to end of list if not already present
							describedBy += " " + errorID;
						}
						$(element).attr("aria-describedby", describedBy);

						// If this element is grouped, then assign to all elements in the same group
						group = this.groups[element.name];
						if (group) {
							v = this;
							$.each(v.groups, function (name, testgroup) {
								if (testgroup === group) {
									$("[name='" + v.escapeCssMeta(name) + "']", v.currentForm).attr("aria-describedby", error.attr("id"));
								}
							});
						}
					}
				}
				if (!message && this.settings.success) {
					error.text("");
					if (typeof this.settings.success === "string") {
						error.addClass(this.settings.success);
					} else {
						this.settings.success(error, element);
					}
				}
				this.toShow = this.toShow.add(error);
			},

			errorsFor: function errorsFor(element) {
				var name = this.escapeCssMeta(this.idOrName(element)),
				    describer = $(element).attr("aria-describedby"),
				    selector = "label[for='" + name + "'], label[for='" + name + "'] *";

				// 'aria-describedby' should directly reference the error element
				if (describer) {
					selector = selector + ", #" + this.escapeCssMeta(describer).replace(/\s+/g, ", #");
				}

				return this.errors().filter(selector);
			},

			// See https://api.jquery.com/category/selectors/, for CSS
			// meta-characters that should be escaped in order to be used with JQuery
			// as a literal part of a name/id or any selector.
			escapeCssMeta: function escapeCssMeta(string) {
				return string.replace(/([\\!"#$%&'()*+,./:;<=>?@\[\]^`{|}~])/g, "\\$1");
			},

			idOrName: function idOrName(element) {
				return this.groups[element.name] || (this.checkable(element) ? element.name : element.id || element.name);
			},

			validationTargetFor: function validationTargetFor(element) {

				// If radio/checkbox, validate first element in group instead
				if (this.checkable(element)) {
					element = this.findByName(element.name);
				}

				// Always apply ignore filter
				return $(element).not(this.settings.ignore)[0];
			},

			checkable: function checkable(element) {
				return (/radio|checkbox/i.test(element.type)
				);
			},

			findByName: function findByName(name) {
				return $(this.currentForm).find("[name='" + this.escapeCssMeta(name) + "']");
			},

			getLength: function getLength(value, element) {
				switch (element.nodeName.toLowerCase()) {
					case "select":
						return $("option:selected", element).length;
					case "input":
						if (this.checkable(element)) {
							return this.findByName(element.name).filter(":checked").length;
						}
				}
				return value.length;
			},

			depend: function depend(param, element) {
				return this.dependTypes[typeof param === "undefined" ? "undefined" : _typeof(param)] ? this.dependTypes[typeof param === "undefined" ? "undefined" : _typeof(param)](param, element) : true;
			},

			dependTypes: {
				"boolean": function boolean(param) {
					return param;
				},
				"string": function string(param, element) {
					return !!$(param, element.form).length;
				},
				"function": function _function(param, element) {
					return param(element);
				}
			},

			optional: function optional(element) {
				var val = this.elementValue(element);
				return !$.validator.methods.required.call(this, val, element) && "dependency-mismatch";
			},

			startRequest: function startRequest(element) {
				if (!this.pending[element.name]) {
					this.pendingRequest++;
					$(element).addClass(this.settings.pendingClass);
					this.pending[element.name] = true;
				}
			},

			stopRequest: function stopRequest(element, valid) {
				this.pendingRequest--;

				// Sometimes synchronization fails, make sure pendingRequest is never < 0
				if (this.pendingRequest < 0) {
					this.pendingRequest = 0;
				}
				delete this.pending[element.name];
				$(element).removeClass(this.settings.pendingClass);
				if (valid && this.pendingRequest === 0 && this.formSubmitted && this.form()) {
					$(this.currentForm).submit();

					// Remove the hidden input that was used as a replacement for the
					// missing submit button. The hidden input is added by `handle()`
					// to ensure that the value of the used submit button is passed on
					// for scripted submits triggered by this method
					if (this.submitButton) {
						$("input:hidden[name='" + this.submitButton.name + "']", this.currentForm).remove();
					}

					this.formSubmitted = false;
				} else if (!valid && this.pendingRequest === 0 && this.formSubmitted) {
					$(this.currentForm).triggerHandler("invalid-form", [this]);
					this.formSubmitted = false;
				}
			},

			previousValue: function previousValue(element, method) {
				method = typeof method === "string" && method || "remote";

				return $.data(element, "previousValue") || $.data(element, "previousValue", {
					old: null,
					valid: true,
					message: this.defaultMessage(element, { method: method })
				});
			},

			// Cleans up all forms and elements, removes validator-specific events
			destroy: function destroy() {
				this.resetForm();

				$(this.currentForm).off(".validate").removeData("validator").find(".validate-equalTo-blur").off(".validate-equalTo").removeClass("validate-equalTo-blur").find(".validate-lessThan-blur").off(".validate-lessThan").removeClass("validate-lessThan-blur").find(".validate-lessThanEqual-blur").off(".validate-lessThanEqual").removeClass("validate-lessThanEqual-blur").find(".validate-greaterThanEqual-blur").off(".validate-greaterThanEqual").removeClass("validate-greaterThanEqual-blur").find(".validate-greaterThan-blur").off(".validate-greaterThan").removeClass("validate-greaterThan-blur");
			}

		},

		classRuleSettings: {
			required: { required: true },
			email: { email: true },
			url: { url: true },
			date: { date: true },
			dateISO: { dateISO: true },
			number: { number: true },
			digits: { digits: true },
			creditcard: { creditcard: true }
		},

		addClassRules: function addClassRules(className, rules) {
			if (className.constructor === String) {
				this.classRuleSettings[className] = rules;
			} else {
				$.extend(this.classRuleSettings, className);
			}
		},

		classRules: function classRules(element) {
			var rules = {},
			    classes = $(element).attr("class");

			if (classes) {
				$.each(classes.split(" "), function () {
					if (this in $.validator.classRuleSettings) {
						$.extend(rules, $.validator.classRuleSettings[this]);
					}
				});
			}
			return rules;
		},

		normalizeAttributeRule: function normalizeAttributeRule(rules, type, method, value) {

			// Convert the value to a number for number inputs, and for text for backwards compability
			// allows type="date" and others to be compared as strings
			if (/min|max|step/.test(method) && (type === null || /number|range|text/.test(type))) {
				value = Number(value);

				// Support Opera Mini, which returns NaN for undefined minlength
				if (isNaN(value)) {
					value = undefined;
				}
			}

			if (value || value === 0) {
				rules[method] = value;
			} else if (type === method && type !== "range") {

				// Exception: the jquery validate 'range' method
				// does not test for the html5 'range' type
				rules[method] = true;
			}
		},

		attributeRules: function attributeRules(element) {
			var rules = {},
			    $element = $(element),
			    type = element.getAttribute("type"),
			    method,
			    value;

			for (method in $.validator.methods) {

				// Support for <input required> in both html5 and older browsers
				if (method === "required") {
					value = element.getAttribute(method);

					// Some browsers return an empty string for the required attribute
					// and non-HTML5 browsers might have required="" markup
					if (value === "") {
						value = true;
					}

					// Force non-HTML5 browsers to return bool
					value = !!value;
				} else {
					value = $element.attr(method);
				}

				this.normalizeAttributeRule(rules, type, method, value);
			}

			// 'maxlength' may be returned as -1, 2147483647 ( IE ) and 524288 ( safari ) for text inputs
			if (rules.maxlength && /-1|2147483647|524288/.test(rules.maxlength)) {
				delete rules.maxlength;
			}

			return rules;
		},

		dataRules: function dataRules(element) {
			var rules = {},
			    $element = $(element),
			    type = element.getAttribute("type"),
			    method,
			    value;

			for (method in $.validator.methods) {
				value = $element.data("rule" + method.charAt(0).toUpperCase() + method.substring(1).toLowerCase());

				// Cast empty attributes like `data-rule-required` to `true`
				if (value === "") {
					value = true;
				}

				this.normalizeAttributeRule(rules, type, method, value);
			}
			return rules;
		},

		staticRules: function staticRules(element) {
			var rules = {},
			    validator = $.data(element.form, "validator");

			if (validator.settings.rules) {
				rules = $.validator.normalizeRule(validator.settings.rules[element.name]) || {};
			}
			return rules;
		},

		normalizeRules: function normalizeRules(rules, element) {

			// Handle dependency check
			$.each(rules, function (prop, val) {

				// Ignore rule when param is explicitly false, eg. required:false
				if (val === false) {
					delete rules[prop];
					return;
				}
				if (val.param || val.depends) {
					var keepRule = true;
					switch (_typeof(val.depends)) {
						case "string":
							keepRule = !!$(val.depends, element.form).length;
							break;
						case "function":
							keepRule = val.depends.call(element, element);
							break;
					}
					if (keepRule) {
						rules[prop] = val.param !== undefined ? val.param : true;
					} else {
						$.data(element.form, "validator").resetElements($(element));
						delete rules[prop];
					}
				}
			});

			// Evaluate parameters
			$.each(rules, function (rule, parameter) {
				rules[rule] = $.isFunction(parameter) && rule !== "normalizer" ? parameter(element) : parameter;
			});

			// Clean number parameters
			$.each(["minlength", "maxlength"], function () {
				if (rules[this]) {
					rules[this] = Number(rules[this]);
				}
			});
			$.each(["rangelength", "range"], function () {
				var parts;
				if (rules[this]) {
					if ($.isArray(rules[this])) {
						rules[this] = [Number(rules[this][0]), Number(rules[this][1])];
					} else if (typeof rules[this] === "string") {
						parts = rules[this].replace(/[\[\]]/g, "").split(/[\s,]+/);
						rules[this] = [Number(parts[0]), Number(parts[1])];
					}
				}
			});

			if ($.validator.autoCreateRanges) {

				// Auto-create ranges
				if (rules.min != null && rules.max != null) {
					rules.range = [rules.min, rules.max];
					delete rules.min;
					delete rules.max;
				}
				if (rules.minlength != null && rules.maxlength != null) {
					rules.rangelength = [rules.minlength, rules.maxlength];
					delete rules.minlength;
					delete rules.maxlength;
				}
			}

			return rules;
		},

		// Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
		normalizeRule: function normalizeRule(data) {
			if (typeof data === "string") {
				var transformed = {};
				$.each(data.split(/\s/), function () {
					transformed[this] = true;
				});
				data = transformed;
			}
			return data;
		},

		// https://jqueryvalidation.org/jQuery.validator.addMethod/
		addMethod: function addMethod(name, method, message) {
			$.validator.methods[name] = method;
			$.validator.messages[name] = message !== undefined ? message : $.validator.messages[name];
			if (method.length < 3) {
				$.validator.addClassRules(name, $.validator.normalizeRule(name));
			}
		},

		// https://jqueryvalidation.org/jQuery.validator.methods/
		methods: {

			// https://jqueryvalidation.org/required-method/
			required: function required(value, element, param) {

				// Check if dependency is met
				if (!this.depend(param, element)) {
					return "dependency-mismatch";
				}
				if (element.nodeName.toLowerCase() === "select") {

					// Could be an array for select-multiple or a string, both are fine this way
					var val = $(element).val();
					return val && val.length > 0;
				}
				if (this.checkable(element)) {
					return this.getLength(value, element) > 0;
				}
				return value !== undefined && value !== null && value.length > 0;
			},

			// https://jqueryvalidation.org/email-method/
			email: function email(value, element) {

				// From https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
				// Retrieved 2014-01-14
				// If you have a problem with this implementation, report a bug against the above spec
				// Or use custom methods to implement your own email validation
				return this.optional(element) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
			},

			// https://jqueryvalidation.org/url-method/
			url: function url(value, element) {

				// Copyright (c) 2010-2013 Diego Perini, MIT licensed
				// https://gist.github.com/dperini/729294
				// see also https://mathiasbynens.be/demo/url-regex
				// modified to allow protocol-relative URLs
				return this.optional(element) || /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
			},

			// https://jqueryvalidation.org/date-method/
			date: function () {
				var called = false;

				return function (value, element) {
					if (!called) {
						called = true;
						if (this.settings.debug && window.console) {
							console.warn("The `date` method is deprecated and will be removed in version '2.0.0'.\n" + "Please don't use it, since it relies on the Date constructor, which\n" + "behaves very differently across browsers and locales. Use `dateISO`\n" + "instead or one of the locale specific methods in `localizations/`\n" + "and `additional-methods.js`.");
						}
					}

					return this.optional(element) || !/Invalid|NaN/.test(new Date(value).toString());
				};
			}(),

			// https://jqueryvalidation.org/dateISO-method/
			dateISO: function dateISO(value, element) {
				return this.optional(element) || /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(value);
			},

			// https://jqueryvalidation.org/number-method/
			number: function number(value, element) {
				return this.optional(element) || /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
			},

			// https://jqueryvalidation.org/digits-method/
			digits: function digits(value, element) {
				return this.optional(element) || /^\d+$/.test(value);
			},

			// https://jqueryvalidation.org/minlength-method/
			minlength: function minlength(value, element, param) {
				var length = $.isArray(value) ? value.length : this.getLength(value, element);
				return this.optional(element) || length >= param;
			},

			// https://jqueryvalidation.org/maxlength-method/
			maxlength: function maxlength(value, element, param) {
				var length = $.isArray(value) ? value.length : this.getLength(value, element);
				return this.optional(element) || length <= param;
			},

			// https://jqueryvalidation.org/rangelength-method/
			rangelength: function rangelength(value, element, param) {
				var length = $.isArray(value) ? value.length : this.getLength(value, element);
				return this.optional(element) || length >= param[0] && length <= param[1];
			},

			// https://jqueryvalidation.org/min-method/
			min: function min(value, element, param) {
				return this.optional(element) || value >= param;
			},

			// https://jqueryvalidation.org/max-method/
			max: function max(value, element, param) {
				return this.optional(element) || value <= param;
			},

			// https://jqueryvalidation.org/range-method/
			range: function range(value, element, param) {
				return this.optional(element) || value >= param[0] && value <= param[1];
			},

			// https://jqueryvalidation.org/step-method/
			step: function step(value, element, param) {
				var type = $(element).attr("type"),
				    errorMessage = "Step attribute on input type " + type + " is not supported.",
				    supportedTypes = ["text", "number", "range"],
				    re = new RegExp("\\b" + type + "\\b"),
				    notSupported = type && !re.test(supportedTypes.join()),
				    decimalPlaces = function decimalPlaces(num) {
					var match = ("" + num).match(/(?:\.(\d+))?$/);
					if (!match) {
						return 0;
					}

					// Number of digits right of decimal point.
					return match[1] ? match[1].length : 0;
				},
				    toInt = function toInt(num) {
					return Math.round(num * Math.pow(10, decimals));
				},
				    valid = true,
				    decimals;

				// Works only for text, number and range input types
				// TODO find a way to support input types date, datetime, datetime-local, month, time and week
				if (notSupported) {
					throw new Error(errorMessage);
				}

				decimals = decimalPlaces(param);

				// Value can't have too many decimals
				if (decimalPlaces(value) > decimals || toInt(value) % toInt(param) !== 0) {
					valid = false;
				}

				return this.optional(element) || valid;
			},

			// https://jqueryvalidation.org/equalTo-method/
			equalTo: function equalTo(value, element, param) {

				// Bind to the blur event of the target in order to revalidate whenever the target field is updated
				var target = $(param);
				if (this.settings.onfocusout && target.not(".validate-equalTo-blur").length) {
					target.addClass("validate-equalTo-blur").on("blur.validate-equalTo", function () {
						$(element).valid();
					});
				}
				return value === target.val();
			},

			// https://jqueryvalidation.org/remote-method/
			remote: function remote(value, element, param, method) {
				if (this.optional(element)) {
					return "dependency-mismatch";
				}

				method = typeof method === "string" && method || "remote";

				var previous = this.previousValue(element, method),
				    validator,
				    data,
				    optionDataString;

				if (!this.settings.messages[element.name]) {
					this.settings.messages[element.name] = {};
				}
				previous.originalMessage = previous.originalMessage || this.settings.messages[element.name][method];
				this.settings.messages[element.name][method] = previous.message;

				param = typeof param === "string" && { url: param } || param;
				optionDataString = $.param($.extend({ data: value }, param.data));
				if (previous.old === optionDataString) {
					return previous.valid;
				}

				previous.old = optionDataString;
				validator = this;
				this.startRequest(element);
				data = {};
				data[element.name] = value;
				$.ajax($.extend(true, {
					mode: "abort",
					port: "validate" + element.name,
					dataType: "json",
					data: data,
					context: validator.currentForm,
					success: function success(response) {
						var valid = response === true || response === "true",
						    errors,
						    message,
						    submitted;

						validator.settings.messages[element.name][method] = previous.originalMessage;
						if (valid) {
							submitted = validator.formSubmitted;
							validator.resetInternals();
							validator.toHide = validator.errorsFor(element);
							validator.formSubmitted = submitted;
							validator.successList.push(element);
							validator.invalid[element.name] = false;
							validator.showErrors();
						} else {
							errors = {};
							message = response || validator.defaultMessage(element, { method: method, parameters: value });
							errors[element.name] = previous.message = message;
							validator.invalid[element.name] = true;
							validator.showErrors(errors);
						}
						previous.valid = valid;
						validator.stopRequest(element, valid);
					}
				}, param));
				return "pending";
			}
		}

	});

	// Ajax mode: abort
	// usage: $.ajax({ mode: "abort"[, port: "uniqueport"]});
	// if mode:"abort" is used, the previous request on that port (port can be undefined) is aborted via XMLHttpRequest.abort()

	var pendingRequests = {},
	    ajax;

	// Use a prefilter if available (1.5+)
	if ($.ajaxPrefilter) {
		$.ajaxPrefilter(function (settings, _, xhr) {
			var port = settings.port;
			if (settings.mode === "abort") {
				if (pendingRequests[port]) {
					pendingRequests[port].abort();
				}
				pendingRequests[port] = xhr;
			}
		});
	} else {

		// Proxy ajax
		ajax = $.ajax;
		$.ajax = function (settings) {
			var mode = ("mode" in settings ? settings : $.ajaxSettings).mode,
			    port = ("port" in settings ? settings : $.ajaxSettings).port;
			if (mode === "abort") {
				if (pendingRequests[port]) {
					pendingRequests[port].abort();
				}
				pendingRequests[port] = ajax.apply(this, arguments);
				return pendingRequests[port];
			}
			return ajax.apply(this, arguments);
		};
	}
	return $;
});
"use strict";

/*
 * Translated default messages for the jQuery validation plugin.
 * Locale: PT (Portuguese; português)
 * Region: BR (Brazil)
 */
$.extend($.validator.messages, {

	// Core
	required: "Este campo &eacute; requerido.",
	remote: "Por favor, corrija este campo.",
	email: "Por favor, forne&ccedil;a um endere&ccedil;o de email v&aacute;lido.",
	url: "Por favor, forne&ccedil;a uma URL v&aacute;lida.",
	date: "Por favor, forne&ccedil;a uma data v&aacute;lida.",
	dateISO: "Por favor, forne&ccedil;a uma data v&aacute;lida (ISO).",
	number: "Por favor, forne&ccedil;a um n&uacute;mero v&aacute;lido.",
	digits: "Por favor, forne&ccedil;a somente d&iacute;gitos.",
	creditcard: "Por favor, forne&ccedil;a um cart&atilde;o de cr&eacute;dito v&aacute;lido.",
	equalTo: "Por favor, forne&ccedil;a o mesmo valor novamente.",
	maxlength: $.validator.format("Por favor, forne&ccedil;a n&atilde;o mais que {0} caracteres."),
	minlength: $.validator.format("Por favor, forne&ccedil;a ao menos {0} caracteres."),
	rangelength: $.validator.format("Por favor, forne&ccedil;a um valor entre {0} e {1} caracteres de comprimento."),
	range: $.validator.format("Por favor, forne&ccedil;a um valor entre {0} e {1}."),
	max: $.validator.format("Por favor, forne&ccedil;a um valor menor ou igual a {0}."),
	min: $.validator.format("Por favor, forne&ccedil;a um valor maior ou igual a {0}."),
	step: $.validator.format("Por favor, forne&ccedil;a um valor m&uacute;ltiplo de {0}."),

	// Metodos Adicionais
	maxWords: $.validator.format("Por favor, forne&ccedil;a com {0} palavras ou menos."),
	minWords: $.validator.format("Por favor, forne&ccedil;a pelo menos {0} palavras."),
	rangeWords: $.validator.format("Por favor, forne&ccedil;a entre {0} e {1} palavras."),
	accept: "Por favor, forne&ccedil;a um tipo v&aacute;lido.",
	alphanumeric: "Por favor, forne&ccedil;a somente com letras, n&uacute;meros e sublinhados.",
	bankaccountNL: "Por favor, forne&ccedil;a com um n&uacute;mero de conta banc&aacute;ria v&aacute;lida.",
	bankorgiroaccountNL: "Por favor, forne&ccedil;a um banco v&aacute;lido ou n&uacute;mero de conta.",
	bic: "Por favor, forne&ccedil;a um c&oacute;digo BIC v&aacute;lido.",
	cifES: "Por favor, forne&ccedil;a um c&oacute;digo CIF v&aacute;lido.",
	creditcardtypes: "Por favor, forne&ccedil;a um n&uacute;mero de cart&atilde;o de cr&eacute;dito v&aacute;lido.",
	currency: "Por favor, forne&ccedil;a uma moeda v&aacute;lida.",
	dateFA: "Por favor, forne&ccedil;a uma data correta.",
	dateITA: "Por favor, forne&ccedil;a uma data correta.",
	dateNL: "Por favor, forne&ccedil;a uma data correta.",
	extension: "Por favor, forne&ccedil;a um valor com uma extens&atilde;o v&aacute;lida.",
	giroaccountNL: "Por favor, forne&ccedil;a um n&uacute;mero de conta corrente v&aacute;lido.",
	iban: "Por favor, forne&ccedil;a um c&oacute;digo IBAN v&aacute;lido.",
	integer: "Por favor, forne&ccedil;a um n&uacute;mero n&atilde;o decimal.",
	ipv4: "Por favor, forne&ccedil;a um IPv4 v&aacute;lido.",
	ipv6: "Por favor, forne&ccedil;a um IPv6 v&aacute;lido.",
	lettersonly: "Por favor, forne&ccedil;a apenas com letras.",
	letterswithbasicpunc: "Por favor, forne&ccedil;a apenas letras ou pontua&ccedil;ões.",
	mobileNL: "Por favor, fornece&ccedil;a um n&uacute;mero v&aacute;lido de telefone.",
	mobileUK: "Por favor, fornece&ccedil;a um n&uacute;mero v&aacute;lido de telefone.",
	nieES: "Por favor, forne&ccedil;a um NIE v&aacute;lido.",
	nifES: "Por favor, forne&ccedil;a um NIF v&aacute;lido.",
	nowhitespace: "Por favor, n&atilde;o utilize espa&ccedil;os em branco.",
	pattern: "O formato fornecido &eacute; inv&aacute;lido.",
	phoneNL: "Por favor, forne&ccedil;a um n&uacute;mero de telefone v&aacute;lido.",
	phoneUK: "Por favor, forne&ccedil;a um n&uacute;mero de telefone v&aacute;lido.",
	phoneUS: "Por favor, forne&ccedil;a um n&uacute;mero de telefone v&aacute;lido.",
	phonesUK: "Por favor, forne&ccedil;a um n&uacute;mero de telefone v&aacute;lido.",
	postalCodeCA: "Por favor, forne&ccedil;a um n&uacute;mero de c&oacute;digo postal v&aacute;lido.",
	postalcodeIT: "Por favor, forne&ccedil;a um n&uacute;mero de c&oacute;digo postal v&aacute;lido.",
	postalcodeNL: "Por favor, forne&ccedil;a um n&uacute;mero de c&oacute;digo postal v&aacute;lido.",
	postcodeUK: "Por favor, forne&ccedil;a um n&uacute;mero de c&oacute;digo postal v&aacute;lido.",
	postalcodeBR: "Por favor, forne&ccedil;a um CEP v&aacute;lido.",
	require_from_group: $.validator.format("Por favor, forne&ccedil;a pelo menos {0} destes campos."),
	skip_or_fill_minimum: $.validator.format("Por favor, optar entre ignorar esses campos ou preencher pelo menos {0} deles."),
	stateUS: "Por favor, forne&ccedil;a um estado v&aacute;lido.",
	strippedminlength: $.validator.format("Por favor, forne&ccedil;a pelo menos {0} caracteres."),
	time: "Por favor, forne&ccedil;a um hor&aacute;rio v&aacute;lido, no intervado de 00:00 a 23:59.",
	time12h: "Por favor, forne&ccedil;a um hor&aacute;rio v&aacute;lido, no intervado de 01:00 a 12:59 am/pm.",
	url2: "Por favor, forne&ccedil;a uma URL v&aacute;lida.",
	vinUS: "O n&uacute;mero de identifica&ccedil;&atilde;o de ve&iacute;culo informado (VIN) &eacute; inv&aacute;lido.",
	zipcodeUS: "Por favor, forne&ccedil;a um c&oacute;digo postal americano v&aacute;lido.",
	ziprange: "O c&oacute;digo postal deve estar entre 902xx-xxxx e 905xx-xxxx",
	cpfBR: "Por favor, forne&ccedil;a um CPF v&aacute;lido.",
	nisBR: "Por favor, forne&ccedil;a um NIS/PIS v&aacute;lido",
	cnhBR: "Por favor, forne&ccedil;a um CNH v&aacute;lido.",
	cnpjBR: "Por favor, forne&ccedil;a um CNPJ v&aacute;lido."
});
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*!
 * JavaScript Cookie v2.2.1
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */
;(function (factory) {
	var registeredInModuleLoader;
	if (typeof define === 'function' && define.amd) {
		define(factory);
		registeredInModuleLoader = true;
	}
	if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
		module.exports = factory();
		registeredInModuleLoader = true;
	}
	if (!registeredInModuleLoader) {
		var OldCookies = window.Cookies;
		var api = window.Cookies = factory();
		api.noConflict = function () {
			window.Cookies = OldCookies;
			return api;
		};
	}
})(function () {
	function extend() {
		var i = 0;
		var result = {};
		for (; i < arguments.length; i++) {
			var attributes = arguments[i];
			for (var key in attributes) {
				result[key] = attributes[key];
			}
		}
		return result;
	}

	function decode(s) {
		return s.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);
	}

	function init(converter) {
		function api() {}

		function set(key, value, attributes) {
			if (typeof document === 'undefined') {
				return;
			}

			attributes = extend({
				path: '/'
			}, api.defaults, attributes);

			if (typeof attributes.expires === 'number') {
				attributes.expires = new Date(new Date() * 1 + attributes.expires * 864e+5);
			}

			// We're using "expires" because "max-age" is not supported by IE
			attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

			try {
				var result = JSON.stringify(value);
				if (/^[\{\[]/.test(result)) {
					value = result;
				}
			} catch (e) {}

			value = converter.write ? converter.write(value, key) : encodeURIComponent(String(value)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);

			key = encodeURIComponent(String(key)).replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent).replace(/[\(\)]/g, escape);

			var stringifiedAttributes = '';
			for (var attributeName in attributes) {
				if (!attributes[attributeName]) {
					continue;
				}
				stringifiedAttributes += '; ' + attributeName;
				if (attributes[attributeName] === true) {
					continue;
				}

				// Considers RFC 6265 section 5.2:
				// ...
				// 3.  If the remaining unparsed-attributes contains a %x3B (";")
				//     character:
				// Consume the characters of the unparsed-attributes up to,
				// not including, the first %x3B (";") character.
				// ...
				stringifiedAttributes += '=' + attributes[attributeName].split(';')[0];
			}

			return document.cookie = key + '=' + value + stringifiedAttributes;
		}

		function get(key, json) {
			if (typeof document === 'undefined') {
				return;
			}

			var jar = {};
			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all.
			var cookies = document.cookie ? document.cookie.split('; ') : [];
			var i = 0;

			for (; i < cookies.length; i++) {
				var parts = cookies[i].split('=');
				var cookie = parts.slice(1).join('=');

				if (!json && cookie.charAt(0) === '"') {
					cookie = cookie.slice(1, -1);
				}

				try {
					var name = decode(parts[0]);
					cookie = (converter.read || converter)(cookie, name) || decode(cookie);

					if (json) {
						try {
							cookie = JSON.parse(cookie);
						} catch (e) {}
					}

					jar[name] = cookie;

					if (key === name) {
						break;
					}
				} catch (e) {}
			}

			return key ? jar[key] : jar;
		}

		api.set = set;
		api.get = function (key) {
			return get(key, false /* read as raw */);
		};
		api.getJSON = function (key) {
			return get(key, true /* read as json */);
		};
		api.remove = function (key, attributes) {
			set(key, '', extend(attributes, {
				expires: -1
			}));
		};

		api.defaults = {};

		api.withConverter = init;

		return api;
	}

	return init(function () {});
});
'use strict';

APP.component.SearchResult = VtexClass.extend({
  init: function init(options) {
    this.setup(options);
  },

  setup: function setup(options) {
    this.options = $.extend({
      $totalSearchResult: $('.resultado-busca-numero:first .value'),
      $termsSearchResult: $('.resultado-busca-termo:first .value')
    }, options);
  },

  getTotalSearchResult: function getTotalSearchResult() {
    return this.options.$totalSearchResult.text();
  },

  getTermsSearchResult: function getTermsSearchResult() {
    return this.options.$termsSearchResult.text();
  }
});
'use strict';

APP.controller.About = VtexClass.extend({
  init: function init() {
    var self = this;
    self.setup();
    self.start();
    self.bind();
  },

  setup: function setup() {},

  start: function start() {
    // shelf
    $('.amissima--shelf ul').slick({
      arrows: true,
      infinite: false,
      slidesToShow: 4,
      slidesToScroll: 1,
      responsive: [{
        breakpoint: 9999,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1
        }
      }, {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      }]
    });
  },

  bind: function bind() {}
});
"use strict";

APP.controller.Account = VtexClass.extend({
  init: function init() {
    var self = this;
    self.setup();
    self.start();
    self.bind();
  },

  setup: function setup() {
    this.options = {};
  },

  start: function start() {},

  bind: function bind() {}
});
'use strict';

APP.component.CartMini = VtexClass.extend({
  // init
  init: function init(options) {
    var _this = this;

    this.count = 0;
    this.element = options.element ? options.element : $('.header-amissima--cart--content');

    vtexjs.checkout.getOrderForm().done(function (orderForm) {
      _this.loadCart(orderForm);
    });

    $(window).on('orderFormUpdated.vtex', function (evt, orderForm) {
      _this.count = orderForm.items.length;
      _this.loadCart(orderForm);
    });
  },

  // add product
  addProduct: function addProduct(product, parent) {
    if (parent instanceof Object && product instanceof Object) {
      var item = $('<li class="header-amissima--cart--item" />');
      var link = $('<a class="link" href="' + product.detailUrl + '" />');

      if (link) {
        var image = $('<div class="image">\n        <img src="' + product.imageUrl + '" alt="' + product.name + '" /></div>');

        var info = void 0;

        if (product.sellingPrice !== product.price && product.sellingPrice !== 0) {
          info = $('<div class="info">\n            <p class="name">' + product.name + '</p>\n            <p class="price">\n              <span class="price-normal">R$ ' + this.moneyConvert(product.price.toString()) + '</span>\n              <span class="price-selling">R$ ' + this.moneyConvert(product.sellingPrice.toString()) + '</span>\n            </p>\n          </div>');
        } else {
          info = $('<div class="info">\n            <p class="name">' + product.name + '</p>\n            <p class="price">\n              <span class="price-selling">R$ ' + this.moneyConvert(product.price.toString()) + '</span>\n            </p>\n          </div>');
        }

        link.append(image);
        link.append(info);
        item.append(link);
      }

      parent.append(item);
    }
  },

  // load cart
  loadCart: function loadCart(orderForm) {
    var _this2 = this;

    if (orderForm instanceof Object) {
      var list = this.element.parent().find('.header-amissima--cart--list');
      var number = this.element.parent().find('.header-amissima--cart--open > .number');
      var numberMobile = this.element.parent().find('.header-amissima--mobile-controls--bag .number');
      console.log(orderForm);
      if (orderForm.items.length > 0) {
        list.empty();

        console.log(number, numberMobile, parseInt(orderForm.items.length));
        number.text(parseInt(orderForm.items.length));
        numberMobile.text(parseInt(orderForm.items.length));

        if (list instanceof Object) {
          this.total(orderForm.totalizers);
          orderForm.items.map(function (item) {
            return _this2.addProduct(item, list);
          });
        }

        return true;
      }

      number.text('');
      numberMobile.text('');
    }
  },

  // money convert
  moneyConvert: function moneyConvert(value) {
    var val = value.toString().split('');
    var num = val.splice(-2);
    num = val.join('') + '.' + num.join('');

    return num.replace(/[.]/g, ",").replace(/\d(?=(?:\d{3})+(?:\D|$))/g, "$&.");
  },

  // open cart
  openCloseCart: function openCloseCart(value) {
    if (this.element instanceof Object) {
      this.element.attr('data-active', value);
    }
  },

  // toggle
  toggle: function toggle() {
    if (this.element instanceof Object) {
      var toggle = this.element.attr('data-active');

      if ($(window).width() <= 1024) {
        var parent = $('.header-amissima').attr('data-type');

        if (parent !== 'search') {
          parent.attr('data-type', 'search');
          return true;
        }

        parent.attr('data-type', '');
        return false;
      }

      return this.element.attr('data-active', toggle === 'true' ? false : true);
    }
  },

  // total
  total: function total(totalizers) {
    if (totalizers instanceof Object) {
      var total = this.element.find('.header-amissima--cart--controls > .total .price');

      if (total instanceof Object) {
        total.text('R$ ' + this.moneyConvert(totalizers[0].value.toString()));
      }
    }
  }
});
'use strict';

APP.controller.Catalog = VtexClass.extend({
  // init
  init: function init() {
    this.setup();
    this.start();
    this.bind();
  },

  // bind
  bind: function bind() {},

  // number count
  numberCount: function numberCount() {
    var parent = this.element.find('.amissima-catalog--breadcrumb');
    var count = this.element.find('.searchResultsTime:first-child .resultado-busca-numero .value');

    if (count) {
      var element = '<p class="count">' + count.text() + ' itens</p>';
      parent.append(element);
    }
  },

  // filters
  filters: function filters() {
    var _this = this;

    var filters = this.element.find('.amissima-catalog--filters');

    if (filters.length > 0) {
      var items = filters.find('.search-multiple-navigator fieldset.refino');

      $.each(items, function (index, element) {
        var item = $(element);
        var btn = item.find('h5');
        var className = btn.text().replace(/[^a-zA-Z ]/g, "");

        if (btn.length > 0) {
          _this.filterActive(btn, items);
          _this.filterType(item, className.toLowerCase());
        }
      });

      this.filterMobile(filters);
    }
  },

  // filter add text
  filterAddText: function filterAddText(item) {
    if (item instanceof Object) {
      var container = $('<div class="container"></div>');

      container.append('<p class="title">' + item.find('h5').text() + '</p>');
      container.append(item.find('div'));

      item.append(container);
    }
  },

  // filter active "button"
  filterActive: function filterActive(btn, items) {
    if (btn instanceof Object) {
      btn.on('click', function (event) {
        var parent = $(event.target).parent();

        if (parent.length > 0) {
          $.each(items, function (index, item) {
            var element = $(item);

            if (parent[0] !== item) {
              element.removeClass('active');
            }
          });

          parent.toggleClass('active');
        }
      });
    }
  },

  // filter clear
  filterClearText: function filterClearText(element, type, className) {
    var item = $(element);

    if (item) {
      var input = item.find('input');
      var text = type === true ? item.text().replace(/(\s)(\()([0-9]*)(\))/gi, '') : item.text();
      var textElement = $('<span class="text">' + text + '</span>');

      item.empty();
      item.append(input);
      item.append(textElement);

      if (className === 'cor') {
        var color = text.replace(/\s+/g, '-').toLowerCase();
        item.prepend('<img class="active" src="/arquivos/color-' + color + '.png" onError="this.className=\'\'" alt="' + color + '" />');
      }
    }
  },

  // filter mobile
  filterMobile: function filterMobile(element) {
    var _this2 = this;

    if (element.length > 0) {
      var buttonMobile = $('<button class="btn-filter-open">\n        filtrar<span class="icon icon-filter"></span>\n      </button>');

      buttonMobile.on('click', function () {
        buttonMobile.parent().toggleClass(function (e) {
          if (e === 0) {
            _this2.filterMobileActive();
          }

          return 'active';
        });
      });

      element.append(buttonMobile);
    }
  },

  // filter mobile active
  filterMobileActive: function filterMobileActive() {
    var parent = $('.refino.cor');

    if (parent.find('.container .btn-more').length === 0) {
      var btnMore = $('<button class="btn-more">\n        <span class="text">Ver mais</span>\n        <span class="text">Ver menos</span>\n        <span class="icon icon-arrow-down"></span>\n      </button>');

      btnMore.on('click', function () {
        parent.toggleClass('more');
      });

      parent.find('.container').append(btnMore);
    }

    return 'active';
  },

  // filter type
  filterType: function filterType(item, className) {
    var _this3 = this;

    if (item instanceof Object === true) {
      item.addClass(className);

      switch (className) {
        case 'tendncias':
          $(item).find('div > label').each(function (index, item) {
            return _this3.filterClearText(item, false);
          });
          break;
        case 'cor':
          $(item).find('div > label').each(function (index, item) {
            return _this3.filterClearText(item, true, className);
          });
          break;
        case 'tamanho':
          $(item).find('div > label').each(function (index, item) {
            return _this3.filterClearText(item, true);
          });
          break;
        default:
      }

      this.filterAddText(item);
    }
  },

  filterSubCategories: function filterSubCategories() {
    var parent = $('.catalog .amissima-catalog--filters .search-multiple-navigator');
    var menu = $('.catalog .amissima-catalog--filters .search-single-navigator');
    var button = $('<h5 class="even">Sub Categorias</h5>');

    var filter = $('<fieldset class="refino"></fieldset>');
    filter.prepend(button);

    if (menu.length && parent.length) {
      filter.append(menu);
      parent.prepend(filter);
      this.filterSubCategoriesRefactory(menu, filter);
    } else {
      menu.addClass('search-multiple-navigator');
      menu.prepend(filter);
      this.filterSubCategoriesRefactory(menu, filter);
    }
  },

  filterSubCategoriesRefactory: function filterSubCategoriesRefactory(element, parent) {
    if (parent.length > 0 && element.length > 0) {
      var container = $('<div class="groups"></div>');
      parent.append(container);

      if (container.length > 0) {
        this.filterSubCategoriesRefactoryGroup(element, container);
      }

      return true;
    }

    return false;
  },

  filterSubCategoriesRefactoryGroup: function filterSubCategoriesRefactoryGroup(element, container) {
    element.find('.Hide, .Hide + ul').remove();

    element.find('h3, h4').each(function (index, elem) {
      var item = $(elem);
      var list = item.next();
      var group = $('<div class="group"></div>');

      group.append(item);
      // group.append(list)

      if (container.length > 0) {
        setTimeout(function () {
          return container.append(group);
        }, 1000);
      }
    });
  },

  // mobile check filter
  mobileCheckFilter: function mobileCheckFilter() {
    if ($(window).width() <= 1024) {
      $('.amissima-catalog--filters').removeClass('active');
    }
  },

  // hide result
  _hideResult: function _hideResult() {
    this.resultItems.find('.amissima--shelf > ul').stop(true, true).slideUp('slow');
  },

  // show result
  _showResult: function _showResult() {
    this.resultItems.find('.amissima--shelf > ul').stop(true, true).slideDown('slow');
  },

  // scroll top
  _scrollToTopResult: function _scrollToTopResult() {
    $('html, body').stop().animate({
      scrollTop: 0
    }, 500);
  },

  // search
  search: function search() {
    var _this4 = this;

    this.resultItems.vtexSearch({
      $selectOrder: this.order,
      pagination: true
    }).on('vtexsearch.beforeFilter vtexsearch.beforeChangeOrder vtexsearch.beforeChangePage', function () {
      _this4._hideResult();
      _this4._scrollToTopResult();
    }).on('vtexsearch.afterFilter vtexsearch.afterChangeOrder vtexsearch.afterChangePage', function () {
      _this4._showResult();
    }).on('vtexsearch.afterSearch', function () {});
  },

  // setup
  setup: function setup() {
    this.element = $('.catalog');
    this.resultItems = $('.resultItemsWrapper div[id^="ResultItems"]');
    this.order = $('.search-order');

    new APP.component.Select({
      selector: '.amissima-select',
      callback: this.mobileCheckFilter.bind(this)
    });
  },

  // start
  start: function start() {
    this.numberCount();
    this.filterSubCategories();
    this.filters();
    this.search();

    new APP.component.Search({});
    new APP.component.Shelf($('.amissima--shelf')[0]);
  }
});
'use strict';

APP.controller.Collection = VtexClass.extend({
  init: function init() {
    var self = this;
    self.setup();
    self.start();
    self.bind();
  },

  setup: function setup() {},

  start: function start() {
    new APP.component.Shelf($('.amissima--shelf')[0]);
    this.clonePages();
  },

  bind: function bind() {},
  clonePages: function clonePages() {
    if ($('.pager.bottom').is(':empty')) {
      $('.pager.bottom .pages').clone().appendTo('.pager.bottom');
    }
  }
});
'use strict';

APP.controller.General = VtexClass.extend({
  init: function init() {
    var self = this;
    self.setup();
    self.start();
    self.bind();
  },

  setup: function setup() {
    this.removeHelperComplement();
  },

  start: function start() {
    var header = new APP.component.Header({ selector: '.header-amissima' });
    var search = new APP.component.Search({});
    // const shelf = new APP.component.Shelf();
    this._isLoggedIn();
    this._newsletter();
  },

  _newsletter: function _newsletter() {

    var response = '<div class="newsletter-confirm">\n      <div class="newsletter-confirm--content">\n        <p class="title">Obrigado por se cadastrar!</p>\n        <span>Em breve voc\xEA receber\xE1 nossas novidades.</span>\n        <a class="link close" href="javascript:void(0)">Fechar</a>\n      </div>\n    </div>';

    $('body').append(response);

    $(document).on('click', '.newsletter-confirm .link.close', function (e) {
      e.preventDefault();
      $('.newsletter-confirm').fadeOut();
    });

    var SPMaskBehavior = function SPMaskBehavior(val) {
      return val.replace(/\D/g, '').length === 11 ? '(00) 00000-0000' : '(00) 0000-00009';
    },
        spOptions = {
      onKeyPress: function onKeyPress(val, e, field, options) {
        field.mask(SPMaskBehavior.apply({}, arguments), options);
      }
    };

    $('.footer-amissima--newsletter .form input[name="phone"]').mask(SPMaskBehavior, spOptions);

    $('.footer-amissima--newsletter .form').validate({
      submitHandler: function submitHandler(form) {

        var url = $(form).attr('action');
        var type = $(form).attr('method');

        var _name = $(form).find('input[name="name"]').val();
        var email = $(form).find('input[name="email"]').val();
        var phone = $(form).find('input[name="phone"]').val();

        var first_name = _name.split(' ')[0] || '';
        var last_name = _name.substring(first_name.length).trim() || '';

        var data = {
          'isNewsletterOptIn': true,
          'email': email,
          'homePhone': phone,
          'firstName': first_name,
          'lastName': last_name
        };
        console.log('data', data);

        var post = JSON.stringify(data);

        console.log('email', email);

        $.ajax({
          url: url,
          type: type,
          data: post,
          dataType: 'json',
          headers: {
            'Accept': 'application/vnd.vtex.ds.v10+json',
            'Content-Type': 'application/json'
          }
        }).then(function (response) {

          // alert('Cadastro realizado');
          $('.newsletter-confirm').fadeIn();
          $('.footer-amissima--newsletter .form').find('input').val('');
        }, function (error) {

          console.error('error', error);
          var message = JSON.parse(error.responseText);

          var labelNull = $('.input-default[type="email"]').next().length > 0;
          if (labelNull) {
            $('.input-default[type="email"]').next().text('Este e-mail <br/>já está cadastrado.').show();
          } else {
            $('.input-control').eq(1).append('<label id="email-error" class="error" for="email">Este e-mail <br/>já está cadastrado.</label>').show();
          };
          // alert(message.Message);
        });
      }
    });
  },

  _isLoggedIn: function _isLoggedIn() {
    vtexjs.checkout.getOrderForm().done(function (orderForm) {
      // faz a verificação no atributo loggedIn
      if (orderForm.loggedIn) {
        var name = orderForm.clientProfileData.firstName;
        var email = orderForm.clientProfileData.email;
        var user;
        name === null ? user = email : user = name;
        // var helcome = $('.account-user').text().replace('{{user}}', user)

        $('.header-amissima').find('.welcome .text').text('Ol\xE1, ' + name);
        $('.header-amissima').find('.account .text').text('Ol\xE1, ' + name);
        // $('.header-amissima .link-login').find('.logout').show()
      } else {
        // var helcome = $('.account-user').text().replace('{{user}}', 'faça seu login')
        // $('.header-amissima .link-login').find('.welcome').html('<a href="/login" title="login">Olá, faça seu login</a>')
        // $('.header-amissima .link-login').find('.logout').hide()
        // $('.header-amissima .link-login').find('.link').hide()
        console.log('Não logado');
      }
    });
  },

  bind: function bind() {},

  removeHelperComplement: function removeHelperComplement() {
    $('[id^="helperComplement_"]').remove();
  }
});
'use strict';

APP.component.Header = VtexClass.extend({
  // init
  init: function init(props) {
    this.element = $(props.selector);

    if (this.element instanceof Object) {
      this.load();
      this.clickItemSubmenu();
      this.clickControlsElements();
    }
  },

  // load
  load: function load() {
    this.logout();
    this.checkLogin();
    this.cartOpen();

    window.addEventListener('scroll', this.onScroll.bind(this), false);
  },

  // cart click out
  cartClickOut: function cartClickOut(event, element, cart) {
    if (event instanceof Object === false || element instanceof Object === false || cart instanceof Object === false) return false;

    var properties = element[0].getBoundingClientRect();

    if (properties instanceof Object) {
      var x = event.pageX;
      var y = event.pageY;

      if (x < properties.left || x > properties.left + properties.width || y < properties.top || y > properties.top + properties.Header) {
        cart.openCloseCart(false);
      }
    }
  },

  // cart open
  cartOpen: function cartOpen() {
    var _this = this;

    var button = this.element.find('.header-amissima--cart--open');
    var element = this.element.find('.header-amissima--cart--content');

    if (button instanceof Object) {
      var cart = new APP.component.CartMini({ element: element });

      button.on('click', function () {
        var check = cart.toggle();

        if (check === undefined) {
          $(window).on('click', function (event) {
            _this.cartClickOut(event, element, cart);
          });
        } else {
          $(window).off('click');
        }
      });
    }
  },

  // check login
  checkLogin: function checkLogin() {
    var _this2 = this;

    vtexjs.checkout.getOrderForm().done(function (orderForm) {
      var element = _this2.element.find('.header-amissima--cart-login');

      if (element instanceof Object) {
        $(element).attr('data-login', orderForm.loggedIn);
      }
    });
  },

  // click item submenu - MOBILE
  clickItemSubmenu: function clickItemSubmenu() {
    var items = this.element.find('.header-amissima--menu--item[data-submenu="true"] > .link > span');

    if (items instanceof Object) {
      $.each(items, function (index, element) {
        var item = $(element);

        if (item instanceof Object) {
          item.on('click', function (event) {
            console.log('Clique');
            if (window.innerWidth < 768) {
              event.preventDefault();
            }

            item.parents().attr('data-active', item.parent().attr('data-active') === 'true' ? false : true);
          });
        }
      });
    }
  },

  // controls mobile
  clickControlsElements: function clickControlsElements() {
    var _this3 = this;

    var controls = this.element.find('.header-amissima--mobile-controls > button');

    if (controls instanceof Object) {
      $.each(controls, function (index, element) {
        return _this3.onControlMobile($(element));
      });
    }
  },

  // logout
  logout: function logout() {
    var btnLogout = this.element.find('.logout');

    if (btnLogout instanceof Object) {
      btnLogout.on('click', function () {
        return $.ajax({
          url: "/no-cache/user/logout"
        }).done(function () {
          return location.reload();
        });
      });
    }
  },

  // on control open - MOBILE
  onControlMobile: function onControlMobile(item) {
    var _this4 = this;

    if (item instanceof Object) {
      item.on('click', function (event) {
        var type = event.currentTarget.getAttribute('data-type');
        var value = type !== _this4.element.attr('data-type') ? type : '';
        $('body').toggleClass('menuIsOpen');

        _this4.element.attr('data-type', value);
      });
    }
  },

  // on scroll
  onScroll: function onScroll() {
    var top = window.pageYOffset || document.documentElement.scrollTop;

    if (this.element instanceof Object) {
      this.element.attr('data-scroll', top > 120);
    }
  }
});
'use strict';

APP.controller.Home = VtexClass.extend({
  // init
  init: function init() {
    var self = this;
    self.setup();
    self.start();
    self.bind();
  },

  // setup
  setup: function setup() {},

  // start
  start: function start() {
    // amissima home banner
    $('.amissima-home--banners-mobile').slick({
      dots: true,
      adaptiveHeight: true,
      mobileFirst: true,
      autoplay: false,
      responsive: [{
        breakpoint: 1025,
        settings: "unslick"
      }, {
        breakpoint: 1024,
        settings: {
          slidesToScroll: 1,
          slidesToShow: 1,
          arrows: false
        }
      }]
    });
    $('.amissima-home--webdoor--desktop').slick({
      dots: false,
      adaptiveHeight: true,
      mobileFirst: true,
      pauseOnHover: false,
      autoplay: true,
      autoplaySpeed: 2500,
      responsive: [{
        breakpoint: 1024,
        settings: "unslick"
      }, {
        breakpoint: 1025,
        settings: {
          slidesToScroll: 1,
          slidesToShow: 1,
          arrows: true
        }
      }]
    });
    $('.amissima-home--off-sale').slick({
      dots: false,
      adaptiveHeight: true,
      mobileFirst: true,
      pauseOnHover: false,
      autoplay: true,
      autoplaySpeed: 2500,
      responsive: [{
        breakpoint: 1024,
        settings: "unslick"
      }, {
        breakpoint: 1025,
        settings: {
          slidesToScroll: 1,
          slidesToShow: 1,
          arrows: false
        }
      }]
    });
    $('.amissima-home--webdoor--mobile').slick({
      dots: true,
      adaptiveHeight: true,
      mobileFirst: true,
      autoplay: true,
      autoplaySpeed: 5000,
      responsive: [{
        breakpoint: 1025,
        settings: "unslick"
      }, {
        breakpoint: 1024,
        settings: {
          slidesToScroll: 1,
          slidesToShow: 1,
          arrows: false
        }
      }]
    });

    // shelf
    $('.amissima--shelf ul').slick({
      arrows: true,
      infinite: false,
      slidesToShow: 4,
      slidesToScroll: 1,
      responsive: [{
        breakpoint: 9999,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1
        }
      }, {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      }]
    });

    // this.instagram();
    this.instagramStatic();

    new APP.component.Shelf($('.amissima--shelf')[0]);
  },

  instagram: function instagram() {
    // Insgram user Token
    // var token = $('#instagramToken').text().replace(' ', '');
    var token = $('#instagramToken').text().replace(' ', '');
    // Insgram user ID
    var userid = '310810222';
    // Number of pictures
    var num_photos = 4;

    $.ajax({
      url: 'https://api.instagram.com/v1/users/' + userid + '/media/recent',
      dataType: 'jsonp',
      type: 'GET',
      data: {
        access_token: token,
        count: num_photos
      },
      success: function success(data) {
        // console.log('data', data);
        $('.amissima-home--instagram--list').append('<ul></ul>');

        for (var i = 0; i < data.data.length; i++) {
          $('.amissima-home--instagram--list ul').append('<li><div class="home__instagram--image"><a href="' + data.data[i].link + '" target="_blank"><figure><img src="' + data.data[i].images.low_resolution.url + '"></figure></a></div></li>');
        }

        // amissmia instagram
        $('.amissima-home--instagram--list ul').slick({
          dots: false,
          arrows: true,
          slidesToShow: 1,
          slidesToScroll: 1,
          mobileFirst: true,
          autoplay: false,
          responsive: [{
            breakpoint: 769,
            settings: "unslick"
          }, {
            breakpoint: 768,
            settings: {
              arrows: true,
              slidesToShow: 1,
              slidesToScroll: 1
            }
          }]
        });
      },
      error: function error(data) {
        // console.log(data);
      }
    });
  },
  instagramStatic: function instagramStatic() {
    $('.amissima-home--instagram--items').slick({
      dots: false,
      arrows: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      mobileFirst: true,
      autoplay: false,
      responsive: [{
        breakpoint: 769,
        settings: "unslick"
      }, {
        breakpoint: 768,
        settings: {
          arrows: true,
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }]
    });
  },

  // bind
  bind: function bind() {}
});
"use strict";

APP.controller.Login = VtexClass.extend({
  init: function init() {
    var self = this;
    self.setup();
    self.start();
    self.bind();
  },

  setup: function setup() {},

  start: function start() {

    $(document).ready(function () {
      $("body").on("click", ".vtexIdUI .modal-header .close", function (e) {
        e.preventDefault();
        window.location.href = "/";
      });
    });
    $(window).load(function () {
      console.log('Len: ', $('.vtexIdUI-providers-btn').length);
      $('.vtexIdUI-providers-btn').removeAttr('tabindex');
    });
  },

  bind: function bind() {}

});
"use strict";

APP.controller.NeoaAsist = VtexClass.extend({
  init: function init() {
    var self = this;
    self.setup();
    self.start();
    self.bind();
  },

  setup: function setup() {},

  start: function start() {},

  bind: function bind() {}
});
'use strict';

APP.controller.Product = VtexClass.extend({
  // init
  init: function init() {
    var self = this;
    self.setup();
    self.start();
    self.bind();
  },

  // setup
  setup: function setup() {},

  // start
  start: function start() {
    this.buyButton();
    this.buyButtonConfirm();
    this.productGallery();
    this.productVideo();

    this.descriptionProductText();
    this.descriptionTabs();

    this.colorsTransform();
    this.shared();
    this.changeSku();
    // this.scrollButtomFunction()

    var shelf = new APP.component.Shelf();
    shelf.skuProduct($('.amissima--shelf'));

    $('.amissima--shelf ul').slick({
      arrows: true,
      infinite: false,
      slidesToShow: 4,
      slidesToScroll: 1,
      responsive: [{
        breakpoint: 1024,
        settings: "unslick"
      }, {
        breakpoint: 1023,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      }]
    });
  },

  getVariations: function getVariations(sku) {

    return $.ajax({
      url: '/api/catalog_system/pub/products/variations/' + sku,
      type: 'GET',
      dataType: 'JSON',
      async: true
    }).then(function (data) {

      return data;
    });
  },

  //Change sku
  changeSku: function changeSku() {
    var _that = this;
    $('.item-dimension-Cor').on('change', '.sku-selector', function () {
      var cor = $(this).data('value');
      var currentSku = void 0;
      var currentProduct = void 0;

      var productID = skuJson_0.productId;

      _that.getVariations(productID).then(function (data) {
        console.log('data', data);
        $.each(data.skus, function (key, item) {
          if (item.dimensions.Cor === cor) {
            currentSku = item.sku;
            currentProduct = item.skuname;
            console.log('item', item);
            return true;
          }
        });

        _that.productGallery(currentSku);
        _that.productVideo(currentSku);
      });
    });
  },

  // buy button
  buyButton: function buyButton() {
    var _this = this;

    var button = $('.product__info--buy .buy-button');

    if (button.length > 0) {

      button.off('click').on('click', function (event) {
        event.preventDefault();

        var href = button.attr('href');

        if (href.match(/javascript:alert/g)) {
          _this.buyError(href);
        } else {
          $('.product__info--price .error').remove();
          _this.buySend(href);
        }
      });
    }
  },

  // buy button confirm
  buyButtonConfirm: function buyButtonConfirm() {
    var btnContinue = $('.product__buy--sell--content .link.btn');
    btnContinue.on('click', function () {
      return $('body').removeClass('sell');
    });
  },

  // buy error
  buyError: function buyError(href) {
    var parent = $('.product__info--price');

    if (parent.length > 0) {
      var text = href.replace("javascript:alert('", '').replace(".');", '');
      var element = $('<p class="error">' + text + '</p>');

      $(parent[parent.length - 1]).prepend(element);
    }
  },

  // buy send
  buySend: function buySend(href) {
    var sku = parseInt(this.getUrlParam(href, 'sku', ''), 10);

    if (typeof sku === 'number') {
      $.ajax({
        url: '/checkout/cart/add?sku=' + sku + '&qty=1&seller=1&redirect=true&sc=1',
        method: 'GET'
      }).done(function (data, status) {
        if (status === 'success') {
          $('body').addClass('sell');
        }
      });
    }
  },

  // get url param
  getUrlParam: function getUrlParam(href, parameter, defaultvalue) {
    var urlparameter = defaultvalue;

    if (href.indexOf(parameter) > -1) {
      urlparameter = this.getVarsString(href)[parameter];
    }

    return urlparameter;
  },

  // get vars string
  getVarsString: function getVarsString(href) {
    var vars = {};
    var parts = href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
      return vars[key] = value;
    });

    return vars;
  },

  // get images thumb
  getImagesThumb: function getImagesThumb(images) {
    return images.map(function (image) {
      return image[4].Path;
    });
  },

  // get images large
  getImagesLarge: function getImagesLarge(images) {
    return images.map(function (image) {
      return image[3].Path;
    });
  },

  // product gallery
  productGallery: function productGallery(currentSku) {
    var _that = this;
    var sku = currentSku || skuJson.skus[0].sku;
    this.getSKUData(sku).then(function (data) {
      var images = data[0].Images;
      var largeHTML;
      var thumbsHTML;

      if ($('.product__gallery--pictures').hasClass('slick-initialized')) {
        $('.product__gallery--pictures').slick('unslick');
      }

      if ($('.product__gallery--thumbs').hasClass('slick-initialized')) {
        $('.product__gallery--thumbs').slick('unslick');
      }

      largeHTML = _that.getImagesLarge(images).reduce(function (prevImage, prodImage) {
        var id = prodImage.match(/ids\/(\d+)/).pop();
        var zoomURL = prodImage;
        return prevImage + ('<div class="easyzoom"><a href="' + prodImage + '" class="product__gallery--pictures--item" data-id="' + id + '"><img src="' + prodImage + '" alt="" /></a></div>');
        // return prevImage + `<div class="product__gallery--pictures--item" data-id="${id}"><img src="${prodImage}" alt="" /></div>`;
      }, '');

      $('.product__gallery--pictures').html(largeHTML).slick({
        dots: false,
        arrows: true,
        speed: 400,
        slidesToShow: 2,
        slidesToScroll: 2,
        infinite: false,
        asNavFor: '.product__gallery--thumbs',
        // onInit: function() {
        // },
        responsive: [{
          breakpoint: 640,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
            dots: true,
            arrows: false
          }
        }]
      });

      if ($(window).width() > 768) {
        $('.easyzoom').easyZoom({ loadingNotice: "Carregando imagem" });
      }

      thumbsHTML = _that.getImagesThumb(images).reduce(function (prevThumb, thumb) {
        var id = thumb.match(/ids\/(\d+)/).pop();
        return prevThumb + ('<div class="product__gallery--thumbs-thumb" data-id="' + id + '"><img src="' + thumb + '" alt="" /></div>');
      }, '');
      $('.product__gallery--thumbs').html(thumbsHTML).slick({
        dots: false,
        infinite: false,
        arrows: true,
        speed: 400,
        slidesToShow: 5,
        slidesToScroll: 1,
        focusOnSelect: true,
        vertical: true,
        verticalSwiping: true,
        asNavFor: '.product__gallery--pictures',
        onAfterChange: function onAfterChange(event, slick, index) {
          $('.product__gallery--thumbs .slick-slide').removeClass('thumb-active');
          $('.product__gallery--thumbs .slick-active').eq(0).addClass('thumb-active');
        }
      });
      // Set active class to first thumbnail slides
      $('.product__gallery--thumbs .slick-active').eq(0).addClass('thumb-active');

      // Change slide onmouseenter
      $(".product__gallery--thumbs .slick-slide").mouseenter(function () {
        $(this).trigger("click");
      });
    });
  },

  //video
  productVideo: function productVideo(currentSku) {
    console.log('currentSku', currentSku);

    var product = skuJson.skus[0].skuname.replace(/ /g, "-");

    var settings = {
      "url": '/api/catalog_system/pub/products/search/' + product,
      "method": "GET",
      "timeout": 0,
      "headers": {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    };

    $.ajax(settings).done(function (response) {
      if (currentSku) {
        var items = response[0].items;
        var item = items.filter(function (current) {
          return current.itemId == currentSku;
        });
        var video = item[0].Videos[0];
      } else {
        var video = response[0].items[0].Videos[0];
      }

      if (!!video && video.length) {

        video = video.replace('vimeo.com/', 'player.vimeo.com/video/');

        var vimeoVideoID = video.replace('https://player.vimeo.com/video/', '');

        var videoTemplate = '<iframe src="' + video + '?autoplay=1&loop=1&sidedock=0" allow="autoplay" width="500" height="281" frameborder="0"></iframe>';

        $.getJSON('https://www.vimeo.com/api/v2/video/' + vimeoVideoID + '.json?callback=?', { format: "json" }, function (vimeovideo) {
          console.log(vimeovideo[0].thumbnail_small.replace("https://i.vimeocdn.com/video/", "").replace("_100x75.jpg", ""));
          $('.product__gallery--thumbs').slick('slickAdd', '<div><div class=\'product__gallery--thumbs-thumb product__gallery--thumbs-video\'><img src=\'' + vimeovideo[0].thumbnail_small + '\' alt=\'Veja o Video\'/></div></div>', 0);
          $('.product__gallery--pictures').slick('slickAdd', '<div><div><div class=\'product__gallery--pictures--item\'>' + videoTemplate + '</div></div></div>', 0);
        });
      }
    });
  },

  // get sku data
  getSKUData: function getSKUData(sku) {
    return $.ajax({
      url: '/produto/sku/' + sku,
      type: 'GET',
      dataType: 'JSON',
      async: true
    }).then(function (data) {
      return data;
    });
  },

  // bind
  bind: function bind() {},

  // color input image color
  colorsTransform: function colorsTransform() {
    var items = $('.product__info--price .Cor .skuList input');

    items.each(function (index, element) {
      var input = $(element);
      var label = input.next();

      if (input.length > 0) {
        var text = input.val().replace(/(\s)(\()([0-9]*)(\))/gi, '');

        if (label.length > 0) {
          var color = text.replace(/\s+/g, '-').toLowerCase();
          label.empty();
          label.text('');
          label.prepend('<img class="active" src="/arquivos/color-' + color + '.png" onError="this.className=\'\'" alt="' + color + '" />');
        }
      }
    });
  },

  // description tabs
  descriptionTabs: function descriptionTabs() {
    var _this2 = this;

    var description = $('.product__info--description .title');
    var tab = $('.product__info--specification .name-field');

    description.on('click', function (e) {
      return _this2.descriptionTabsOpen(e);
    });
    tab.on('click', function (e) {
      return _this2.descriptionTabsOpen(e);
    });
  },

  // description tabs open
  descriptionTabsOpen: function descriptionTabsOpen(event) {
    var parent = $(event.currentTarget).parent();

    if (parent.length > 0) {
      parent.toggleClass('active');
    }
  },

  // description product
  descriptionProductText: function descriptionProductText() {
    var parent = $('.product__info--description');
    var title = $('<h4 class="title">Descri\xE7\xE3o do produto</h4>');

    parent.prepend(title);
  },

  // shared
  shared: function shared() {
    var parent = $('.product__info--share');

    var linkW = $('<a class="link" href="https://api.whatsapp.com/send?phone=5511966429343&text=' + (encodeURIComponent(document.title) + ' - ' + encodeURIComponent(window.location.href)) + '">\n            <img src="/arquivos/whatsapp.svg" alt="Facebook">\n        </a>');

    var linkF = $('<a class="link" href="http://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href) + '">\n            <img src="/arquivos/facebook.svg" alt="Whatsapp">\n        </a>');

    var linkP = $('<a class="link" href="http://pinterest.com/pin/create/button/?url=' + encodeURIComponent(window.location.href) + '">\n            <img src="/arquivos/pinterest-social-logo.svg" alt="Facebook">\n        </a>');
    // const linkW = $(`<a class="link" href="https://api.whatsapp.com/send?text=${encodeURIComponent(document.title) + ' - '+ encodeURIComponent(window.location.href)}">
    //         <span class="icon icon-shared-w"></span>
    //     </a>`)
    //
    // const linkF = $(`<a class="link" href="http://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}">
    //         <span class="icon icon-shared-f"></span>
    //     </a>`)
    //
    // const linkP = $(`<a class="link" href="http://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}">
    //         <span class="icon icon-shared-p"></span>
    //     </a>`)

    parent.append(linkW);
    parent.append(linkF);
    parent.append(linkP);

    $(document).on('click', '.product__info--share .link', function (e) {
      window.open(this.href, "popUpWindow", "height=500,width=500"), e.preventDefault();
    });
  },

  scrollButtomFunction: function scrollButtomFunction() {
    var scrollTopButtom = $('.product__info--buy');

    $(window).scroll(function () {
      if ($(window).scrollTop() > scrollTopButtom.position().top - 140) {
        scrollTopButtom.addClass('prev-buttom-float');
      }
      if ($(window).scrollTop() > scrollTopButtom[0].offsetTop - 50) {
        scrollTopButtom.addClass('buttom-float');
      }
      if ($(window).scrollTop() < scrollTopButtom[0].offsetTop - 50) {
        scrollTopButtom.removeClass('buttom-float');
      }
      if ($(window).scrollTop() < scrollTopButtom[0].offsetTop - 140) {
        scrollTopButtom.removeClass('prev-buttom-float');
      }
    });
  }
});
'use strict';

APP.controller.SearchPageEmpty = VtexClass.extend({
  // init
  init: function init() {
    this.start();
    this.bind();
  },

  // start
  start: function start() {
    this.element = $('.amissima-search--form');
    this.value = '';

    if (this.element instanceof Object) {
      this.form();
      this.termSearch();

      $('.amissima--shelf').each(function (index, element) {
        var item = $(element);

        if (item.length > 0) {
          new APP.component.Shelf();

          item.find('> ul').slick({
            arrows: true,
            infinite: false,
            slidesToShow: 4,
            slidesToScroll: 1,
            responsive: [{
              breakpoint: 9999,
              settings: {
                slidesToShow: 4,
                slidesToScroll: 1
              }
            }, {
              breakpoint: 1024,
              settings: {
                slidesToShow: 2,
                slidesToScroll: 1
              }
            }]
          });
        }
      });
    }
  },

  // bind
  bind: function bind() {},

  // form
  form: function form() {
    var form = this.element.find('form');

    this.onInput(form);
    this.onSubmit(form);
  },

  // get search params
  getSearchParams: function getSearchParams(k) {
    var p = {};
    location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (s, k, v) {
      return p[k] = v;
    });

    return k ? p[k] : p;
  },

  // on input
  onInput: function onInput(form) {
    var _this = this;

    if (form instanceof Object === false) return false;

    var input = form.find('input[type="text"]');

    input.on('keyup', function (event) {
      if (event instanceof Object) {
        _this.value = event.target.value;
        form.attr('action', '/busca/?ft=');
      }
    });
  },

  // on submit
  onSubmit: function onSubmit(form) {
    var _this2 = this;

    if (form instanceof Object === false) return false;

    var button = form.find('form');

    if (button instanceof Object) {
      button.on('click', function (event) {
        event.preventDefault();

        if (_this2.value !== '') {
          form.submit();
        }
      });
    }
  },

  // term
  termSearch: function termSearch() {
    var term = this.getSearchParams('ft');
    var text = this.element.find('.title .term');

    if (text instanceof Object) {
      text.text(term);
    }
  }
});
'use strict';

var _VtexClass$extend;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

APP.controller.SearchPage = VtexClass.extend((_VtexClass$extend = {
  // init
  init: function init() {
    this.setup();
    this.start();
    this.bind();
  },

  // setup
  setup: function setup() {
    this.element = $('.search');
    this.resultItems = $('.resultItemsWrapper div[id^="ResultItems"]');
    this.order = $('.search-order');

    new APP.component.Select({
      selector: '.amissima-select',
      callback: this.mobileCheckFilter.bind(this)
    });

    this.title(this.element.find('.amissima-search--term'));
  },

  // hide result
  _hideResult: function _hideResult() {
    this.resultItems.find('.amissima--shelf > ul').stop(true, true).slideUp('slow');
  },

  // show result
  _showResult: function _showResult() {
    this.resultItems.find('.amissima--shelf > ul').stop(true, true).slideDown('slow');
  },

  // scroll top
  _scrollToTopResult: function _scrollToTopResult() {
    $('html, body').stop().animate({
      scrollTop: 0
    }, 500);
  },

  // start
  start: function start() {
    var _this = this;

    new APP.component.Shelf($($('.amissima--shelf')[0]));

    this.resultItems.vtexSearch({
      $selectOrder: this.order,
      pagination: true
    }).on('vtexsearch.beforeFilter vtexsearch.beforeChangeOrder vtexsearch.beforeChangePage', function () {
      _this._hideResult();
      _this._scrollToTopResult();
    }).on('vtexsearch.afterFilter vtexsearch.afterChangeOrder vtexsearch.afterChangePage', function () {
      _this._showResult();
    }).on('vtexsearch.afterSearch', function () {});

    if ($('.search-multiple-navigator').length === 0) {
      this.makeFakeMultipleNavigator();
      this.filterSubCategories();
    }

    this.filters();
  },

  // bind
  bind: function bind() {},

  // get search params
  getSearchParams: function getSearchParams(k) {
    var p = {};
    location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (s, k, v) {
      return p[k] = v;
    });

    var term = k ? p[k] : p;

    if (!term) {
      return window.location.pathname.split('/').pop();
    }

    return term;
  },

  // mobile check filter
  mobileCheckFilter: function mobileCheckFilter() {
    if ($(window).width() <= 1024) {
      $('.amissima-catalog--filters').removeClass('active');
    }
  },

  // title
  title: function title(parent) {
    if (parent instanceof Object === false) {
      return false;
    }

    var term = this.getSearchParams('term');
    var total = this.element.find('.searchResultsTime .resultado-busca-numero:first-child .value')[0];

    var termText = parent.find('.info .text-search .term');
    var totalText = parent.find('.info .text:first-child .term');

    this.titleTerm(term, termText);
    this.titleTerm(parseInt(total.innerText), totalText);

    if (termText instanceof Object) {
      termText.text(term);
    }
  },

  // term
  titleTerm: function titleTerm(value, element) {
    if (element instanceof Object) {
      console.log('value', value);
      element.text(value);
    }
  },

  filterSubCategories: function filterSubCategories() {
    var parent = $('.catalog .amissima-catalog--filters .search-multiple-navigator');
    var menu = $('.catalog .amissima-catalog--filters .search-single-navigator');
    var button = $('<h5 class="even">Sub Categorias</h5>');

    console.log(menu);

    var filter = $('<fieldset class="refino"></fieldset>');
    filter.prepend(button);

    if (menu.length) {
      filter.append(menu);

      if (parent.length > 0) {
        parent.prepend(filter);
        this.filterSubCategoriesRefactory(menu, filter);
      }
    }
  },

  filterSubCategoriesRefactory: function filterSubCategoriesRefactory(element, parent) {
    if (parent.length > 0 && element.length > 0) {
      var container = $('<div class="groups"></div>');
      parent.append(container);

      if (container.length > 0) {
        this.filterSubCategoriesRefactoryGroup(element, container);
      }

      return true;
    }

    return false;
  },

  filterSubCategoriesRefactoryGroup: function filterSubCategoriesRefactoryGroup(element, container) {
    element.find('.Hide, .Hide + ul').remove();

    element.find('h3, h4').each(function (index, elem) {
      var item = $(elem);
      var list = item.next();
      var group = $('<div class="group"></div>');

      group.append(item);
      group.append(list);

      if (container.length > 0) {
        setTimeout(function () {
          return container.append(group);
        }, 1000);
      }
    });
  },

  makeFakeMultipleNavigator: function makeFakeMultipleNavigator() {

    $('<div class="search-multiple-navigator"></div>').insertBefore('.search-single-navigator');
  },

  // filters
  filters: function filters() {
    var _this2 = this;

    var filters = this.element.find('.amissima-catalog--filters');

    if (filters.length > 0) {
      var items = filters.find('.search-multiple-navigator fieldset.refino');

      $.each(items, function (index, element) {
        var item = $(element);
        var btn = item.find('h5');
        var className = btn.text().replace(/[^a-zA-Z ]/g, "");

        if (btn.length > 0) {
          _this2.filterActive(btn, items);
          _this2.filterType(item, className.toLowerCase());
        }
      });

      this.filterMobile(filters);
    }
  },

  // filter add text
  filterAddText: function filterAddText(item) {
    if (item instanceof Object) {
      var container = $('<div class="container"></div>');

      container.append('<p class="title">' + item.find('h5').text() + '</p>');
      container.append(item.find('div'));

      item.append(container);
    }
  },

  // filter active "button"
  filterActive: function filterActive(btn, items) {
    if (btn instanceof Object) {
      btn.on('click', function (event) {
        var parent = $(event.target).parent();

        if (parent.length > 0) {
          $.each(items, function (index, item) {
            var element = $(item);

            if (parent[0] !== item) {
              element.removeClass('active');
            }
          });

          parent.toggleClass('active');
        }
      });
    }
  },

  // filter clear
  filterClearText: function filterClearText(element, type, className) {
    var item = $(element);

    if (item) {
      var input = item.find('input');
      var text = type === true ? item.text().replace(/(\s)(\()([0-9]*)(\))/gi, '') : item.text();
      var textElement = $('<span class="text">' + text + '</span>');

      item.empty();
      item.append(input);
      item.append(textElement);

      if (className === 'cor') {
        var color = text.replace(/\s+/g, '-').toLowerCase();
        item.prepend('<img class="active" src="/arquivos/color-' + color + '.png" onError="this.className=\'\'" alt="' + color + '" />');
      }
    }
  },

  // filter mobile
  filterMobile: function filterMobile(element) {
    var _this3 = this;

    if (element.length > 0) {
      var buttonMobile = $('<button class="btn-filter-open">\n        filtrar<span class="icon icon-filter"></span>\n      </button>');

      buttonMobile.on('click', function () {
        buttonMobile.parent().toggleClass(function (e) {
          if (e === 0) {
            _this3.filterMobileActive();
          }

          return 'active';
        });
      });

      element.append(buttonMobile);
    }
  },

  // filter mobile active
  filterMobileActive: function filterMobileActive() {
    var parent = $('.refino.cor');

    if (parent.find('.container .btn-more').length === 0) {
      var btnMore = $('<button class="btn-more">\n        <span class="text">Ver mais</span>\n        <span class="text">Ver menos</span>\n        <span class="icon icon-arrow-down"></span>\n      </button>');

      btnMore.on('click', function () {
        parent.toggleClass('more');
      });

      parent.find('.container').append(btnMore);
    }

    return 'active';
  },

  // filter type
  filterType: function filterType(item, className) {
    var _this4 = this;

    if (item instanceof Object === true) {
      item.addClass(className);

      switch (className) {
        case 'tendncias':
          $(item).find('div > label').each(function (index, item) {
            return _this4.filterClearText(item, false);
          });
          break;
        case 'cor':
          $(item).find('div > label').each(function (index, item) {
            return _this4.filterClearText(item, true, className);
          });
          break;
        case 'tamanho':
          $(item).find('div > label').each(function (index, item) {
            return _this4.filterClearText(item, true);
          });
          break;
        default:
      }

      this.filterAddText(item);
    }
  }

}, _defineProperty(_VtexClass$extend, 'filterSubCategoriesRefactory', function filterSubCategoriesRefactory(element, parent) {
  if (parent.length > 0 && element.length > 0) {
    var container = $('<div class="groups"></div>');
    parent.append(container);

    if (container.length > 0) {
      this.filterSubCategoriesRefactoryGroup(element, container);
    }

    return true;
  }

  return false;
}), _defineProperty(_VtexClass$extend, 'filterSubCategoriesRefactoryGroup', function filterSubCategoriesRefactoryGroup(element, container) {
  element.find('.Hide, .Hide + ul').remove();

  element.find('h3, h4').each(function (index, elem) {
    var item = $(elem);
    var list = item.next();
    var group = $('<div class="group"></div>');

    group.append(item);
    group.append(list);

    if (container.length > 0) {
      setTimeout(function () {
        return container.append(group);
      }, 1000);
    }
  });
}), _VtexClass$extend));
'use strict';

APP.component.Search = VtexClass.extend({
  // init
  init: function init(options) {
    this.setup(options);
    this.start();
    this.bind();
  },

  // setup
  setup: function setup(options) {
    this.options = $.extend({
      delay: 300,
      maxRows: 12,
      mobileAutoComplete: false,
      thumbSize: 78,

      $scope: $('.header-amissima--search'),
      $input: $('.header-amissima--search--input'),
      $button: $('.header-amissima--search--submit[type="submit"]'),
      $mobIsVisible: $('.menu-bar'),

      classOpen: 'body-header__search--open',
      classTarget: 'header-amissima--search--content',
      classTargetList: 'header-amissima--search--list',
      classTargetListHead: 'header-amissima--search--list-head',
      classTargetListItem: 'header-amissima--search--item',
      classTargetListItemImage: 'product',
      classTargetListItemCategory: 'category',
      classTargetListLink: 'header-amissima--search--content--link'
    }, options);
  },

  // start
  start: function start() {},

  // bind
  bind: function bind() {
    this.bindClickOutside();
    this.bindSearchSubmit();
    this.bindSearch();
    this.bindFocus();
    this.bindClose();
  },

  // bind click out side
  bindClickOutside: function bindClickOutside() {
    var _this2 = this;

    $(document).on('click', function (event) {
      var $closeBox = _this2.options.$scope;

      if (!$closeBox.is(event.target) && $closeBox.has(event.target).length === 0) {
        $('body').removeClass(_this2.options.classOpen);

        _this2.options.$scope.find('.' + _this2.options.classTarget).show().html('').hide().css({
          height: ''
        });
      }
    });
  },

  // close search
  bindClose: function bindClose() {
    var _this3 = this;

    var buttonClose = this.options.$scope.find('.header-amissima--search--submit:not([type])');

    if (buttonClose instanceof Object) {
      buttonClose.on('click', function (event) {
        event.preventDefault();

        if ($(window).width() <= 1024) {
          return $('.header-amissima').attr('data-type', '');
        }

        return _this3.options.$scope.attr('data-active', false);
      });
    }
  },

  // focus events
  bindFocus: function bindFocus() {
    var _this4 = this;

    if (this.options instanceof Object) {
      if (this.options.$input instanceof Object) {
        this.options.$input.focus(function () {
          return _this4.inputOutInFocus(true);
        });
      }
    }
  },

  // bind search submit
  bindSearchSubmit: function bindSearchSubmit() {
    var _this5 = this;

    this.options.$button.on('click', function (event) {
      event.preventDefault();

      var val = _this5.options.$input.val();

      if (val !== '') {
        _this5.submitSearch(val);
      } else {
        _this5.options.$input.focus();
      }
    });
  },

  // bind search
  bindSearch: function bindSearch() {
    var _this6 = this;

    var delay = void 0;

    this.options.$input.on('keyup', function (event) {
      event.preventDefault();

      var _this = $(event.currentTarget);
      var val = _this.val();
      var code = event.keyCode || event.which;

      if (code === 13 && val !== '') {
        _this6.submitSearch(val);

        return true;
      }

      if (_this6._isMob() && _this6.options.mobileAutoComplete === false) {
        return true;
      }

      clearTimeout(delay);

      delay = setTimeout(function () {
        if (val === '') {
          _this6.options.$scope.find('.' + _this6.options.classTarget).html('').hide().css('height', '');

          return;
        }

        _this6.getSearchResult(val);
      }, _this6.options.delay);
    });
  },

  // focus focusout
  inputOutInFocus: function inputOutInFocus(value) {
    if (this.options.$scope instanceof Object) {
      if ($(window).width() <= 1024) {
        var parent = this.options.$scope.parent().parent().parent();

        if (parent.attr('data-type') !== 'search') {
          return parent.attr('data-type', '');
        }
      }

      return this.options.$scope.attr('data-active', value);
    }
  },

  // submit search
  submitSearch: function submitSearch(terms) {
    var urlTerms = encodeURI(terms.trim());
    window.location = '/' + urlTerms;
  },

  // get search result
  getSearchResult: function getSearchResult(terms) {
    var _this7 = this;

    $.ajax({
      url: '/buscaautocomplete',
      type: 'get',
      data: {
        maxRows: this.options.maxRows,
        productNameContains: terms
      }
    }).then(function (response) {
      var checkTitle = false;
      var items = response.itemsReturned;
      var parent = _this7.options.$scope.find('.' + _this7.options.classTarget).show();

      var $listResultHead = $('<ul class="' + _this7.options.classTargetListHead + '" />');
      var $listResult = $('<ul class="' + _this7.options.classTargetList + '" />');

      items.map(function (item) {
        var name = item.name,
            href = item.href,
            thumb = item.thumb;

        var $thumb = _this7._changeImageSize(thumb, _this7.options.thumbSize, 25);
        var productId = $thumb !== '' ? item.items[0].productId : null;

        var $contentTitle = $('<span class="name" />').text(name);

        var $link = $('<a />', {
          class: _this7.options.classTargetListLink,
          href: href
        });

        $link.append($thumb);
        $link.append($contentTitle);

        var $item = $('<li class="' + _this7.options.classTargetListItem + '" />');

        if ($thumb !== '') {
          $item.addClass(_this7.options.classTargetListItemImage);

          if (checkTitle === false) {
            $listResultHead.append('<li class="header-amissima--search--products">\n                <p class="title">Produtos Sugeridos</p>\n              </li>');

            checkTitle = true;
          }

          if (productId) {
            vtexjs.catalog.getProductWithVariations(productId).done(function (product) {
              if (product instanceof Object) {
                var moneyFormat = function moneyFormat(n) {
                  return 'R$ ' + (n / 100).toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
                };

                var options = product.skus[0];
                console.log('options', options);

                if (options.available === true) {
                  if (options.listPrice !== 0 && options.listPrice !== options.bestPrice) {
                    $link.append('<span class="price">De ' + options.listPriceFormated + '</span>');
                  }

                  $link.append('<span class="price-best">Por ' + options.bestPriceFormated + '</span>');

                  if (options.installments) {
                    $link.append('<span class="installments">' + options.installments + 'x de ' + moneyFormat(options.installmentsValue) + ' Sem juros</span>');
                  }
                } else {
                  // $link.hide();
                  $link.append('<span class="price-best">Confira outros tamanhos</span>');

                  if (options.installments) {
                    $link.append('<span class="installments">' + options.installments + '</span>');
                  }
                }
              }
            });
          }
        } else {
          $item.addClass(_this7.options.classTargetListItemCategory);
        }

        $item.append($link);

        if ($thumb !== '') {
          $listResult.append($item);
        } else {
          $listResultHead.append($item);
        }
      });

      parent.empty();

      parent.append($listResultHead);
      parent.append($listResult);
    });
  },

  // change image size
  _changeImageSize: function _changeImageSize(image, newSize, actualSize) {
    return image.replace('-' + actualSize + '-' + actualSize, '-' + newSize + '-' + newSize).replace('width="' + actualSize + '"', 'width="' + newSize + '"').replace('height="' + actualSize + '"', 'height="' + newSize + '"');
  },

  // is mob
  _isMob: function _isMob() {
    if (this.options.$mobIsVisible.is(':visible')) {
      return true;
    }

    return false;
  }
});
'use strict';

APP.component.Select = VtexClass.extend({
  // init
  init: function init(options) {
    this.options = options;

    this.selectItems($(this.options.selector));
  },


  // items
  selectItems: function selectItems(items) {
    var _this = this;

    if (items.length > 0) {
      items.each(function (index, element) {
        var item = $(element);

        if (item.length > 0) {
          _this.createSelectFake(item);
        }
      });
    }
  },


  // create select fake
  createSelectFake: function createSelectFake(item) {
    if (item.length > 0) {
      var select = item.find('select');
      var selectFake = $('<div class="amissima-select--item"></div>');

      this.createSelectFakeTitle(selectFake, select);
      this.createSelectFakeOptions(selectFake, select);

      item.append(selectFake);
    }
  },


  // create select fake clear option
  createSelectFakeClearOption: function createSelectFakeClearOption(option, options, optionFake) {
    var items = optionFake.parent().find('button.option');
    var title = optionFake.parent().parent().find('.amissima-select--title');

    options.each(function (index, item) {
      if (item !== option[0]) {
        $(items[index]).removeClass('active');
      }
    });

    optionFake.addClass('active');
    title.text(option.text());
  },


  // create select fake options
  createSelectFakeOptions: function createSelectFakeOptions(element, select) {
    var _this2 = this;

    var options = select.find('option[value]');

    if (options.length > 0) {
      var content = $('<div class="amissima-select--content"></div>');
      element.append(content);

      options.each(function (index, elementOption) {
        var option = $(elementOption);

        if (option.length > 0 && option.val() !== '') {
          var optionFake = $('<button class="option">' + option.text() + '</button>');

          optionFake.on('click', function (event) {
            select.val(option.val()).change();
            _this2.createSelectFakeClearOption(option, options, $(event.target));
          });

          content.append(optionFake);
        }
      });
    }
  },


  // create select fake title
  createSelectFakeTitle: function createSelectFakeTitle(element, select) {
    var _this3 = this;

    var optionInit = select.find('option[value=""]');
    var textInit = optionInit.length === 0 ? 'Selecione uma opção' : optionInit.text();

    var title = $('<div class="amissima-select--title">' + textInit + '</div>');
    element.append(title);

    element.on('click', function (event) {
      element.toggleClass(function (toggle) {
        return _this3.closeSelectBody(element, toggle);
      });

      if (typeof _this3.options.callback === 'function') {
        _this3.options.callback();
      }
    });
  },


  // close select body
  closeSelectBody: function closeSelectBody(element, toggle) {
    if (toggle === 0) {
      $('body').on('click', function (event) {
        var clientX = event.clientX,
            clientY = event.clientY;

        var properties = element[0].parentElement.getBoundingClientRect();

        if (clientX < properties.x || properties.x + properties.width < clientX) {
          element.removeClass('active');
        }

        if (clientY < properties.y || properties.y + properties.height < clientY) {
          element.removeClass('active');
        }
      });

      return 'active';
    }

    $('body').off('click', function () {});
    return 'active';
  }
});
'use strict';

APP.component.Shelf = VtexClass.extend({
  // init
  init: function init(element) {
    var _this = this;

    $(document).ajaxStop(function () {
      _this.element = element;

      if (_this.element instanceof Object) {
        _this.skuProduct(_this.element);
      }
    });
  },


  // sku button
  skuButton: function skuButton(sku, parent, index) {
    var _this2 = this;

    if (sku instanceof Object && parent instanceof Object) {
      var color = this.spaceReplace(sku.dimensions.Cor);
      var button = $('<button class="color" title=' + color + '>\n          <img class="active" onError="this.className=\'\'" src="/arquivos/color-' + color + '.png" alt=' + color + ' />\n        </button>');

      button.on('click', function (event) {
        var element = parent.parent();

        if (element.length > 0) {
          var image = element.find('.product-image img');
          var listPrice = element.find('.product-info .price .new-price .list-price');
          var price = element.find('.product-info .price .new-price .best-price');

          image.attr('src', sku.image.replace("300-450", "470-700"));

          // if(sku.available === true){
          //   price.text(sku.bestPriceFormated)
          // }else{
          //   price.text('Indisponível');
          // }
          //
          // if(listPrice){
          //   listPrice.text(sku.listPriceFormated)
          // }
          //
          // console.log('shelf sku', sku)

          _this2.skuButtonClear($(event.target));
        }
      });

      parent.append(button);

      if (index === 0) {
        button.addClass('active');
      }
    }
  },


  // sku button clear
  skuButtonClear: function skuButtonClear(button) {
    if (button.length > 0) {
      var buttons = button.parent().find('button');

      buttons.each(function (index, item) {
        $(item).removeClass('active');
      });

      button.addClass('active');
    }
  },


  // sku find
  skuFind: function skuFind(skusProduct, sku) {
    if (Array.isArray(skusProduct) === false && sku instanceof Object === false) {
      return false;
    }

    var check = false;

    for (var i = 0; i < skusProduct.length; i++) {
      var skuTemp = skusProduct[i];

      if (skuTemp.dimensions.Cor === sku.dimensions.Cor) {
        check = true;
      }
    }

    return check;
  },


  // sku filter
  skuFilter: function skuFilter(skus) {
    var _this3 = this;

    if (Array.isArray(skus) === false) {
      return false;
    }

    var skusProduct = [];

    $.each(skus, function (index, sku) {
      if (index === 0) {
        skusProduct.push(sku);
      }

      if (_this3.skuFind(skusProduct, sku) === false) {
        skusProduct.push(sku);
      }
    });

    return skusProduct;
  },


  // sku product
  skuProduct: function skuProduct(shelf) {
    var _this4 = this;

    var products = $(shelf).find('.amissima--shelf--item');

    $.each(products, function (index, element) {
      var item = $(element);
      var productId = parseInt(item.attr('data-id'));

      if (productId) {
        vtexjs.catalog.getProductWithVariations(productId).done(function (product) {
          if (product instanceof Object) {
            _this4.skuProductInsert(product.skus, item);
          }
        });
      }
    });
  },


  // sku product insert
  skuProductInsert: function skuProductInsert(skus, item) {
    if (skus instanceof Object && item instanceof Object) {
      var list = item.find('.product-skus');

      if (list.length !== 0) {
        var skusFilter = this.skuFilter(skus);

        if (skusFilter.length > 0) {
          list.empty();

          for (var i = 0; i < skusFilter.length; i++) {
            var sku = skusFilter[i];

            if (i < 3) {
              this.skuButton(sku, list, i);
            } else {
              var moreText = $('<div class="more">+ ' + (skusFilter.length - i) + '</div>');
              list.append(moreText);

              return false;
            }
          }
        }
      }
    }
  },


  // space replace
  spaceReplace: function spaceReplace(className) {
    return className.replace(/\s+/g, '-').toLowerCase();
  }
});
"use strict";

APP.controller.Stores = VtexClass.extend({
  init: function init() {
    var self = this;
    self.setup();
    self.start();
    self.bind();
  },

  setup: function setup() {},

  start: function start() {},

  bind: function bind() {}

});
'use strict';

/*
Use this component

new APP.component.videoThumb({
      fieldClass: '.value-field.Video',
      width: 400,
      height: 400,
      thumb: '/arquivos/thumb-video.jpg',
      positionThumb: 'bottom'
    })


 */
APP.component.videoThumb = VtexClass.extend({
    init: function init(options) {
        this.setup(options);
        this.manageContent();
        this.bindEvents();
    },

    setup: function setup(options) {
        this.options = $.extend({
            fieldClass: '.Video',
            width: 500,
            height: 500,
            thumb: '/arquivos/thumb-video.png',
            positionThumb: 'bottom' //top
        }, options);
    },

    manageContent: function manageContent() {
        var fieldClass = this.options.fieldClass.replace('.', ''),
            video = $('.value-field.' + fieldClass).html(),

        //video = 'https://www.youtube.com/watch?v=zRxGRX6VrxU',
        that = this;

        if (video && (video.indexOf('youtube') > -1 || video.indexOf('youtu.be') > -1)) {
            $('.value-field.' + fieldClass + ', .name-field.' + fieldClass).hide();
            $('.thumbs a').first().click();
            $('.videoWrapper').remove();
            $('#include').append('<div class="videoWrapper" style="display:none;"><iframe width="' + that.options.width + '" height="' + that.options.height + '" src="" frameborder="0" allowfullscreen="" allowtransparency="true"></iframe></div>');
            $('.value-field.' + fieldClass).each(function () {
                var src = $(this).html();
                if (src.indexOf('youtube') > -1) {
                    src = $(this).find('iframe').length > 0 ? $(this).find('iframe').attr('src') : 'https://www.youtube.com/embed/' + src.split('v=').reverse()[0];
                } else {
                    src = $(this).find('iframe').length > 0 ? $(this).find('iframe').attr('src') : 'https://www.youtube.com/embed/' + src.split('/').reverse()[0];
                }
                var listItem = '<li class="trigger-video" style="cursor:pointer;"><img rel="' + src + '" src="' + that.options.thumb + '" /></li>';

                switch (that.options.positionThumb) {
                    case 'top':
                        $('.thumbs').prepend(listItem);
                        break;
                    default:
                        $('.thumbs').append(listItem);
                }
            });
        }
    },

    bindEvents: function bindEvents() {
        $('li.trigger-video').bind("click", function () {
            $('#include div#image').hide();
            var newRel = $(this).find('img').attr('rel'),
                rel = $('#include .videoWrapper iframe').attr('src');
            if (newRel !== rel) {
                $('#include .videoWrapper iframe').attr('src', newRel);
            }
            if (!$('#include .videoWrapper').is(':visible')) {
                $('#include .videoWrapper').fadeIn();
            }
            $('.ON').removeClass('ON');
            $(this).find('img').addClass('active');
        });

        $('ul.thumbs li a').live('click', function () {
            $('li.trigger-video img').removeClass('active');
            $('#include .videoWrapper').hide();
            $('#include div#image').fadeIn();
        });

        // Iniciando o thumb com o vÃ­deo ativado
        // $('li.trigger-video').click();
        $('.apresentacao').addClass('video-initialized');

        // CorreÃ§Ã£o para o thumb inicial da Vtex que recebe a class ON apÃ³s a execuÃ§Ã£o do mÃ³dulo videoThumb
        if ($('.apresentacao').find('iframe').length > 0) {
            $(document).one('ajaxStop', function () {
                $('.ON').removeClass('ON');
            });
        }
    }

});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZ0ZXgtY2xhc3MuanMiLCJ2dGV4LWNhcnQuanMiLCJ2dGV4LXNlYXJjaC5qcyIsInNsaWNrLmpzIiwianF1ZXJ5LnZhbGlkYXRlLmpzIiwibWVzc2FnZXNfcHRfQlIuanMiLCJqcy5jb29raWUuanMiLCJzZWFyY2hSZXN1bHQuanMiLCJhYm91dC5qcyIsImFjY291bnQuanMiLCJjYXJ0LW1pbi5qcyIsImNhdGFsb2cuanMiLCJjb2xsZWN0aW9uLmpzIiwiZ2VuZXJhbC5qcyIsImhlYWRlci5qcyIsImhvbWUuanMiLCJsb2dpbi5qcyIsIk5lb2FBc2lzdC5qcyIsInByb2R1dG8uanMiLCJzZWFyY2gtZW1wdHkuanMiLCJzZWFyY2gtcGFnZS5qcyIsInNlYXJjaC5qcyIsInNlbGVjdC5qcyIsInNoZWxmLmpzIiwic3RvcmVzLmpzIiwidmlkZW9UaHVtYi5qcyJdLCJuYW1lcyI6WyJ2dGV4Q2xhc3MiLCJpbml0aWFsaXppbmciLCJmblRlc3QiLCJ0ZXN0IiwieHl6Iiwid2luZG93IiwiVnRleENsYXNzIiwiZXh0ZW5kIiwicHJvcCIsIl9zdXBlciIsInByb3RvdHlwZSIsIm5hbWUiLCJmbiIsInRtcCIsInJldCIsImFwcGx5IiwiYXJndW1lbnRzIiwiaW5pdCIsImNvbnN0cnVjdG9yIiwiQVBQIiwiY29yZSIsImNvbXBvbmVudCIsImNvbnRyb2xsZXIiLCJpIiwiJCIsImxvYWQiLCJkb2N1bWVudCIsInJlYWR5IiwiTWFpbiIsIlV0aWwiLCJnZXRDb250cm9sbGVyIiwiYXR0ciIsInN0YXJ0IiwidXRpbCIsImdlbmVyYWwiLCJHZW5lcmFsIiwibG9hZFBhZ2VDb250cm9sbGVyIiwiY3VycmVudENvbnRyb2xsZXIiLCJzZXR0aW5ncyIsImNhcnQiLCJoZWxwZXIiLCJvcGVuQ2FydCIsIndpZHRoIiwiaW5uZXJXaWR0aCIsImFuaW1hdGUiLCJyaWdodCIsImZhZGVJbiIsImFkZENsYXNzIiwiY2xvc2VDYXJ0IiwiZmFkZU91dCIsInJlbW92ZUNsYXNzIiwiZmlsbENhcnQiLCJ2dGV4anMiLCJjaGVja291dCIsImdldE9yZGVyRm9ybSIsImRvbmUiLCJvcmRlckZvcm0iLCJjb25zb2xlIiwibG9nIiwiaXRlbXMiLCJmaW5kIiwiaHRtbCIsInRvUmVhbCIsInRvdGFsaXplcnMiLCJ2YWx1ZSIsImxlbmd0aCIsInRlbXBsYXRlIiwiaW1hZ2VVcmwiLCJxdWFudGl0eSIsInByaWNlIiwiYXBwZW5kIiwiYWRkSXRlbSIsImVsIiwidXJsVGVzdCIsImpvaW4iLCJ1cmwiLCJhbGVydCIsImFqYXgiLCJyZXBsYWNlIiwidHlwZSIsImNyb3NzRG9tYWluIiwiZGF0YVR5cGUiLCJzdWNjZXNzIiwicmVtb3ZlSXRlbSIsImluZGV4IiwiY29uZmlybSIsInRoZW4iLCJpdGVtIiwicmVtb3ZlSXRlbXMiLCJjaGFuZ2VJdGVtIiwiaXRlbUluZGV4IiwiZGF0YSIsInVwZGF0ZUl0ZW0iLCJwYXJzZUludCIsInVwZGF0ZUl0ZW1zIiwiaW50IiwiY291cG9uIiwib24iLCJlIiwicHJldmVudERlZmF1bHQiLCJkaXNjb3VudENvdXBvbiIsInZhbCIsImFkZENvdXBvbiIsInJlbW92ZUNvdXBvbiIsImNsZWFyTWVzc2FnZXMiLCJzZXNzaW9uU3RvcmFnZSIsImdldEl0ZW0iLCJoaWRlIiwic2hvdyIsImFkZERpc2NvdW50Q291cG9uIiwibXNnTGVuZ3RoIiwibWVzc2FnZXMiLCJtc2ciLCJ0ZXh0Iiwic2V0SXRlbSIsInJlbW92ZURpc2NvdW50Q291cG9uIiwic2hpcHBpbmciLCJwb3N0YWxDb2RlIiwiY2FsY3VsYXRlU2hpcHBpbmciLCJhZGRyZXNzIiwic2hpcHBpbmdEYXRhIiwic2V0QWRkcmVzcyIsImxvZ2lzdGljIiwibG9naXN0aWNzSW5mbyIsInNkIiwiZGVsaXZlcnlPcHRpb24iLCJKU09OIiwicGFyc2UiLCJzZWxlY3RlZERlbGl2ZXJ5Q2hhbm5lbCIsImRlbGl2ZXJ5Q2hhbm5lbCIsInNlbGVjdGVkU2xhIiwic2VuZEF0dGFjaG1lbnQiLCJyZXNwIiwidnRleGNhcnQiLCJwYXJhbWV0ZXJzIiwiY2FydEh0bWwiLCJtaW5pQ2FydEh0bWwiLCJjYXJ0QnV0dG9uIiwiYnV5QnV0dG9uIiwiZXZlbnQiLCJrZXlkb3duIiwiaGFzQ2xhc3MiLCJrZXkiLCJrZXlDb2RlIiwiYnRuQWN0aW9uIiwiZGF0YUluZGV4IiwiY2xvc2VzdCIsInF0eUZpZWxkIiwicXR5TWluIiwicXR5TWF4IiwialF1ZXJ5IiwiVnRleFNlYXJjaCIsIiRyZXN1bHQiLCJzZWxmIiwib3B0aW9ucyIsImdldERlZmF1bHRPcHRpb25zIiwiYmluZCIsInJlcXVlc3QiLCJfc2V0UmVxdWVzdCIsIl9jb25jYXRSZXF1ZXN0IiwiX3NldFBhZ2luYXRpb25JbmZvIiwicGFnaW5hdGlvbiIsIl9zZXRQYWdpbmF0aW9uV3JhcCIsIl9jcmVhdGVCdXR0b25zIiwiY2hlY2tBbmRTdGFydCIsImJlZm9yZSIsImNsYXNzTG9hZExlc3MiLCJjbGFzc0xvYWRCdG5IaWRlIiwidGV4dExvYWRMZXNzIiwiYWZ0ZXIiLCJjbGFzc0xvYWRNb3JlIiwidGV4dExvYWRNb3JlIiwiJHBhZ2luYXRpb24iLCJjbGFzcyIsImNsYXNzUGFnaW5hdGlvbiIsIiRwYWdlciIsIl9jaGVja1JlcXVlc3RXaXRoQ29va2llIiwic3RhcnRXaXRoQ29va2llIiwic3RhcnRXaXRob3V0Q29va2llIiwidHJpZ2dlciIsIkNvb2tpZXMiLCJFcnJvciIsImhhc2giLCJsb2NhdGlvbiIsInN1YnN0ciIsImNvb2tpZSIsImdldCIsImNvb2tpZU5hbWUiLCJjb29raWVSZXF1ZXN0IiwibG9jYWxSZXF1ZXN0IiwiaXNOYU4iLCJwYXRoIiwiX3NldFBhcmFtc0Zyb21Db29raWUiLCJfYXBwbHlDb29raWVQYXJhbXMiLCJfZ2V0VG90YWxJdGVtcyIsInRvdGFsSXRlbXMiLCIkdG90YWxJdGVtcyIsInRvdGFsUGFnZXMiLCJfZ2V0VG90YWxQYWdlcyIsIl9jaGVja0FuZExvYWRXaXRoQ29va2llIiwicGFnZU51bWJlciIsInF1ZXJ5IiwiUGFnZU51bWJlciIsIl9zdGFydFBhZ2luYXRpb24iLCJfc2hvd0l0ZW1zIiwiX3Nob3dCdXR0b24iLCJfaGlkZUJ1dHRvbiIsIl9zdGFydEZpcnN0IiwiX3NldFVybEhhc2giLCJfc2F2ZUNvb2tpZSIsInN0YXJ0U2Vjb25kIiwiY2FsbGJhY2siLCJfY2hlY2tEZWZhdWx0UGFyYW1zIiwiX3NldERlZmF1bHRQYXJhbXMiLCJfZGlzYWJsZUJ1dHRvbiIsImNoZWNrSGFzRGVmYXVsdFBhcmFtcyIsIl9jcmVhdGVQYWdpbmF0aW9uIiwiYmluZFBhZ2luYXRpb24iLCJfY2xlYXJQYWdpbmF0aW9uIiwibWV0aG9kIiwicGFnZSIsIl9zZWFyY2giLCJhdHRlbXB0cyIsInJlc3BvbnNlIiwiJGxpc3QiLCIkcHJvZHVjdHMiLCJyZW1vdmUiLCIkaXRlbSIsImNsYXNzSXRlbVByZUxvYWQiLCJwcm9kdWN0c0NvbnRlbnQiLCJpcyIsInN0YXR1cyIsIl9zZXRPcmRlciIsIl9zZXRGaWx0ZXJzIiwiJHNlbGVjdE9yZGVyIiwiTyIsImZxIiwiZmlsdGVyIiwiJGNoZWNrYm94IiwiJGZpbHRlcnMiLCJwYXJlbnQiLCJjbGFzc0ZpbHRlckFjdGl2ZSIsIk9iamVjdCIsImtleXMiLCJkZWZhdWx0UGFyYW1zIiwiaGFzT3duUHJvcGVydHkiLCJfZW5hYmxlQnV0dG9uIiwiYnV0dG9uIiwicmVtb3ZlQXR0ciIsIl9nZXRQYWdlQnlUeXBlIiwiJGl0ZW1zIiwib3BlcmF0aW9uIiwiTnVtYmVyIiwic2hvd1BhZ2UiLCJuZXh0UGFnZSIsImV2YWwiLCJyb3V0ZSIsImxlbiIsImZxUmVzdWx0IiwiX2NvbmNhdFJlcXVlc3RGaWx0ZXIiLCJjb25jYXQiLCJhcnJheSIsInN0cmluZ2lmeSIsInJlcXVlc3RTdHJpbmdpZnkiLCJzZXQiLCJfbG9hZE5leHQiLCJwYWdlQnlUeXBlIiwiX2xvYWRGaXJzdCIsInJlcXVlc3RVcmwiLCJ0ZXh0U3RhdHVzIiwicmVzb3VyY2VzIiwiZ2V0UmVzcG9uc2VIZWFkZXIiLCJzcGxpdCIsImVycm9yIiwicmVzdWx0IiwicGF0dGVybiIsInRvdGFsIiwiTWF0aCIsImNlaWwiLCJwcyIsIlBTIiwiX2NyZWF0ZVBhZ2luYXRpb25GaXJzdEJ1dHRvbiIsIl9jcmVhdGVQYWdpbmF0aW9uUHJldkJ1dHRvbiIsIl9jcmVhdGVQYWdpbmF0aW9uQnV0dG9ucyIsIl9jcmVhdGVQYWdpbmF0aW9uTmV4dEJ1dHRvbiIsIl9jcmVhdGVQYWdpbmF0aW9uTGFzdEJ1dHRvbiIsIiRmaXJzdCIsInRleHRQYWdpbmF0aW9uRmlyc3QiLCJfZGlzYWJsZVBhZ2luYXRpb25CdXR0b24iLCIkcHJldiIsInRleHRQYWdpbmF0aW9uUHJldiIsInBhZ2luYXRpb25SYW5nZUJ1dHRvbnMiLCIkcGFnZSIsImRpc2FibGVkIiwiJG5leHQiLCJ0ZXh0UGFnaW5hdGlvbk5leHQiLCIkbGFzdCIsInRleHRQYWdpbmF0aW9uTGFzdCIsIiRlbGVtZW50IiwiX2dldFJlcXVlc3RVcmwiLCJfc3BsaXRSZXF1ZXN0VXJsIiwic2NyaXB0Q29udGVudCIsIiRzY3JpcHQiLCJleGVjIiwiZGVjb2RlVVJJQ29tcG9uZW50Iiwic3BsaXRVcmwiLCJzZWFyY2giLCJxdWVyeVN0cmluZ1ZURVgiLCJxdWVyeVN0cmluZ0Jyb3dzZXIiLCJzcGxpdEhhc2giLCJxdWVyeU9iamVjdCIsIlJlZ0V4cCIsIm0iLCJfYnVpbGRRdWVyeVN0cmluZ1ZURVhQYXJhbXMiLCJfY2hlY2tBbmRJbnNlcnRRdWVyeVN0cmluZ0Jyb3dzZXJQYXJhbXMiLCJwYXRobmFtZSIsInVybFZhbHVlIiwidXJsS2V5IiwicHVzaCIsImJpbmRMb2FkTW9yZUFuZExlc3MiLCJiaW5kT3JkZXIiLCJiaW5kRmlsdGVycyIsInVuYmluZCIsIm9mZiIsIl90aGlzIiwiX2NoYW5nZU9yZGVyIiwidGFyZ2V0IiwidGFnTmFtZSIsImNoZWNrZWQiLCJfcmVmcmVzaEZpbHRlciIsImFjdGlvbiIsImZpbHRlck1hcCIsImZpbHRlclNwbGl0IiwiaW5kZXhPZiIsInNwbGljZSIsIm1hcCIsIiRyZXN1bHRJdGVtc1dyYXBwZXIiLCJjaGlsZHJlbiIsInRleHRFbXB0eVJlc3VsdCIsInZ0ZXhTZWFyY2giLCJmYWN0b3J5IiwiZGVmaW5lIiwiYW1kIiwiZXhwb3J0cyIsIm1vZHVsZSIsInJlcXVpcmUiLCJTbGljayIsImluc3RhbmNlVWlkIiwiZWxlbWVudCIsIl8iLCJkYXRhU2V0dGluZ3MiLCJkZWZhdWx0cyIsImFjY2Vzc2liaWxpdHkiLCJhZGFwdGl2ZUhlaWdodCIsImFwcGVuZEFycm93cyIsImFwcGVuZERvdHMiLCJhcnJvd3MiLCJhc05hdkZvciIsInByZXZBcnJvdyIsIm5leHRBcnJvdyIsImF1dG9wbGF5IiwiYXV0b3BsYXlTcGVlZCIsImNlbnRlck1vZGUiLCJjZW50ZXJQYWRkaW5nIiwiY3NzRWFzZSIsImN1c3RvbVBhZ2luZyIsInNsaWRlciIsImRvdHMiLCJkb3RzQ2xhc3MiLCJkcmFnZ2FibGUiLCJlYXNpbmciLCJlZGdlRnJpY3Rpb24iLCJmYWRlIiwiZm9jdXNPblNlbGVjdCIsImZvY3VzT25DaGFuZ2UiLCJpbmZpbml0ZSIsImluaXRpYWxTbGlkZSIsImxhenlMb2FkIiwibW9iaWxlRmlyc3QiLCJwYXVzZU9uSG92ZXIiLCJwYXVzZU9uRm9jdXMiLCJwYXVzZU9uRG90c0hvdmVyIiwicmVzcG9uZFRvIiwicmVzcG9uc2l2ZSIsInJvd3MiLCJydGwiLCJzbGlkZSIsInNsaWRlc1BlclJvdyIsInNsaWRlc1RvU2hvdyIsInNsaWRlc1RvU2Nyb2xsIiwic3BlZWQiLCJzd2lwZSIsInN3aXBlVG9TbGlkZSIsInRvdWNoTW92ZSIsInRvdWNoVGhyZXNob2xkIiwidXNlQ1NTIiwidXNlVHJhbnNmb3JtIiwidmFyaWFibGVXaWR0aCIsInZlcnRpY2FsIiwidmVydGljYWxTd2lwaW5nIiwid2FpdEZvckFuaW1hdGUiLCJ6SW5kZXgiLCJpbml0aWFscyIsImFuaW1hdGluZyIsImRyYWdnaW5nIiwiYXV0b1BsYXlUaW1lciIsImN1cnJlbnREaXJlY3Rpb24iLCJjdXJyZW50TGVmdCIsImN1cnJlbnRTbGlkZSIsImRpcmVjdGlvbiIsIiRkb3RzIiwibGlzdFdpZHRoIiwibGlzdEhlaWdodCIsImxvYWRJbmRleCIsIiRuZXh0QXJyb3ciLCIkcHJldkFycm93Iiwic2Nyb2xsaW5nIiwic2xpZGVDb3VudCIsInNsaWRlV2lkdGgiLCIkc2xpZGVUcmFjayIsIiRzbGlkZXMiLCJzbGlkaW5nIiwic2xpZGVPZmZzZXQiLCJzd2lwZUxlZnQiLCJzd2lwaW5nIiwidG91Y2hPYmplY3QiLCJ0cmFuc2Zvcm1zRW5hYmxlZCIsInVuc2xpY2tlZCIsImFjdGl2ZUJyZWFrcG9pbnQiLCJhbmltVHlwZSIsImFuaW1Qcm9wIiwiYnJlYWtwb2ludHMiLCJicmVha3BvaW50U2V0dGluZ3MiLCJjc3NUcmFuc2l0aW9ucyIsImZvY3Vzc2VkIiwiaW50ZXJydXB0ZWQiLCJoaWRkZW4iLCJwYXVzZWQiLCJwb3NpdGlvblByb3AiLCJyb3dDb3VudCIsInNob3VsZENsaWNrIiwiJHNsaWRlciIsIiRzbGlkZXNDYWNoZSIsInRyYW5zZm9ybVR5cGUiLCJ0cmFuc2l0aW9uVHlwZSIsInZpc2liaWxpdHlDaGFuZ2UiLCJ3aW5kb3dXaWR0aCIsIndpbmRvd1RpbWVyIiwib3JpZ2luYWxTZXR0aW5ncyIsIm1vekhpZGRlbiIsIndlYmtpdEhpZGRlbiIsImF1dG9QbGF5IiwicHJveHkiLCJhdXRvUGxheUNsZWFyIiwiYXV0b1BsYXlJdGVyYXRvciIsImNoYW5nZVNsaWRlIiwiY2xpY2tIYW5kbGVyIiwic2VsZWN0SGFuZGxlciIsInNldFBvc2l0aW9uIiwic3dpcGVIYW5kbGVyIiwiZHJhZ0hhbmRsZXIiLCJrZXlIYW5kbGVyIiwiaHRtbEV4cHIiLCJyZWdpc3RlckJyZWFrcG9pbnRzIiwiYWN0aXZhdGVBREEiLCJhZGRTbGlkZSIsInNsaWNrQWRkIiwibWFya3VwIiwiYWRkQmVmb3JlIiwidW5sb2FkIiwiYXBwZW5kVG8iLCJpbnNlcnRCZWZvcmUiLCJlcSIsImluc2VydEFmdGVyIiwicHJlcGVuZFRvIiwiZGV0YWNoIiwiZWFjaCIsInJlaW5pdCIsImFuaW1hdGVIZWlnaHQiLCJ0YXJnZXRIZWlnaHQiLCJvdXRlckhlaWdodCIsImhlaWdodCIsImFuaW1hdGVTbGlkZSIsInRhcmdldExlZnQiLCJhbmltUHJvcHMiLCJsZWZ0IiwidG9wIiwiYW5pbVN0YXJ0IiwiZHVyYXRpb24iLCJzdGVwIiwibm93IiwiY3NzIiwiY29tcGxldGUiLCJjYWxsIiwiYXBwbHlUcmFuc2l0aW9uIiwic2V0VGltZW91dCIsImRpc2FibGVUcmFuc2l0aW9uIiwiZ2V0TmF2VGFyZ2V0Iiwibm90Iiwic2xpY2siLCJzbGlkZUhhbmRsZXIiLCJ0cmFuc2l0aW9uIiwic2V0SW50ZXJ2YWwiLCJjbGVhckludGVydmFsIiwic2xpZGVUbyIsImJ1aWxkQXJyb3dzIiwiYWRkIiwiYnVpbGREb3RzIiwiZG90IiwiZ2V0RG90Q291bnQiLCJmaXJzdCIsImJ1aWxkT3V0Iiwid3JhcEFsbCIsIndyYXAiLCJzZXR1cEluZmluaXRlIiwidXBkYXRlRG90cyIsInNldFNsaWRlQ2xhc3NlcyIsImJ1aWxkUm93cyIsImEiLCJiIiwiYyIsIm5ld1NsaWRlcyIsIm51bU9mU2xpZGVzIiwib3JpZ2luYWxTbGlkZXMiLCJzbGlkZXNQZXJTZWN0aW9uIiwiY3JlYXRlRG9jdW1lbnRGcmFnbWVudCIsImNyZWF0ZUVsZW1lbnQiLCJyb3ciLCJhcHBlbmRDaGlsZCIsImVtcHR5IiwiY2hlY2tSZXNwb25zaXZlIiwiaW5pdGlhbCIsImZvcmNlVXBkYXRlIiwiYnJlYWtwb2ludCIsInRhcmdldEJyZWFrcG9pbnQiLCJyZXNwb25kVG9XaWR0aCIsInRyaWdnZXJCcmVha3BvaW50Iiwic2xpZGVyV2lkdGgiLCJtaW4iLCJ1bnNsaWNrIiwicmVmcmVzaCIsImRvbnRBbmltYXRlIiwiJHRhcmdldCIsImN1cnJlbnRUYXJnZXQiLCJpbmRleE9mZnNldCIsInVuZXZlbk9mZnNldCIsIm1lc3NhZ2UiLCJjaGVja05hdmlnYWJsZSIsIm5hdmlnYWJsZXMiLCJwcmV2TmF2aWdhYmxlIiwiZ2V0TmF2aWdhYmxlSW5kZXhlcyIsIm4iLCJjbGVhblVwRXZlbnRzIiwiaW50ZXJydXB0IiwidmlzaWJpbGl0eSIsImNsZWFuVXBTbGlkZUV2ZW50cyIsIm9yaWVudGF0aW9uQ2hhbmdlIiwicmVzaXplIiwiY2xlYW5VcFJvd3MiLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJzdG9wUHJvcGFnYXRpb24iLCJkZXN0cm95IiwiZmFkZVNsaWRlIiwic2xpZGVJbmRleCIsIm9wYWNpdHkiLCJmYWRlU2xpZGVPdXQiLCJmaWx0ZXJTbGlkZXMiLCJzbGlja0ZpbHRlciIsImZvY3VzSGFuZGxlciIsIiRzZiIsImdldEN1cnJlbnQiLCJzbGlja0N1cnJlbnRTbGlkZSIsImJyZWFrUG9pbnQiLCJjb3VudGVyIiwicGFnZXJRdHkiLCJnZXRMZWZ0IiwidmVydGljYWxIZWlnaHQiLCJ2ZXJ0aWNhbE9mZnNldCIsInRhcmdldFNsaWRlIiwiY29lZiIsImZsb29yIiwib2Zmc2V0TGVmdCIsIm91dGVyV2lkdGgiLCJnZXRPcHRpb24iLCJzbGlja0dldE9wdGlvbiIsIm9wdGlvbiIsImluZGV4ZXMiLCJtYXgiLCJnZXRTbGljayIsImdldFNsaWRlQ291bnQiLCJzbGlkZXNUcmF2ZXJzZWQiLCJzd2lwZWRTbGlkZSIsImNlbnRlck9mZnNldCIsImFicyIsImdvVG8iLCJzbGlja0dvVG8iLCJjcmVhdGlvbiIsInNldFByb3BzIiwic3RhcnRMb2FkIiwibG9hZFNsaWRlciIsImluaXRpYWxpemVFdmVudHMiLCJ1cGRhdGVBcnJvd3MiLCJpbml0QURBIiwibnVtRG90R3JvdXBzIiwidGFiQ29udHJvbEluZGV4ZXMiLCJzbGlkZUNvbnRyb2xJbmRleCIsImFyaWFCdXR0b25Db250cm9sIiwibWFwcGVkU2xpZGVJbmRleCIsImVuZCIsImluaXRBcnJvd0V2ZW50cyIsImluaXREb3RFdmVudHMiLCJpbml0U2xpZGVFdmVudHMiLCJpbml0VUkiLCJtYXRjaCIsImxvYWRSYW5nZSIsImNsb25lUmFuZ2UiLCJyYW5nZVN0YXJ0IiwicmFuZ2VFbmQiLCJsb2FkSW1hZ2VzIiwiaW1hZ2VzU2NvcGUiLCJpbWFnZSIsImltYWdlU291cmNlIiwiaW1hZ2VTcmNTZXQiLCJpbWFnZVNpemVzIiwiaW1hZ2VUb0xvYWQiLCJvbmxvYWQiLCJvbmVycm9yIiwic3JjIiwic2xpY2UiLCJwcmV2U2xpZGUiLCJuZXh0U2xpZGUiLCJwcm9ncmVzc2l2ZUxhenlMb2FkIiwibmV4dCIsInNsaWNrTmV4dCIsInBhdXNlIiwic2xpY2tQYXVzZSIsInBsYXkiLCJzbGlja1BsYXkiLCJwb3N0U2xpZGUiLCIkY3VycmVudFNsaWRlIiwiZm9jdXMiLCJwcmV2Iiwic2xpY2tQcmV2IiwidHJ5Q291bnQiLCIkaW1nc1RvTG9hZCIsImxhc3RWaXNpYmxlSW5kZXgiLCJjdXJyZW50QnJlYWtwb2ludCIsImwiLCJyZXNwb25zaXZlU2V0dGluZ3MiLCJzb3J0IiwiY2xlYXJUaW1lb3V0Iiwid2luZG93RGVsYXkiLCJyZW1vdmVTbGlkZSIsInNsaWNrUmVtb3ZlIiwicmVtb3ZlQmVmb3JlIiwicmVtb3ZlQWxsIiwic2V0Q1NTIiwicG9zaXRpb24iLCJwb3NpdGlvblByb3BzIiwieCIsInkiLCJzZXREaW1lbnNpb25zIiwicGFkZGluZyIsIm9mZnNldCIsInNldEZhZGUiLCJzZXRIZWlnaHQiLCJzZXRPcHRpb24iLCJzbGlja1NldE9wdGlvbiIsIm9wdCIsImJvZHlTdHlsZSIsImJvZHkiLCJzdHlsZSIsIldlYmtpdFRyYW5zaXRpb24iLCJ1bmRlZmluZWQiLCJNb3pUcmFuc2l0aW9uIiwibXNUcmFuc2l0aW9uIiwiT1RyYW5zZm9ybSIsInBlcnNwZWN0aXZlUHJvcGVydHkiLCJ3ZWJraXRQZXJzcGVjdGl2ZSIsIk1velRyYW5zZm9ybSIsIk1velBlcnNwZWN0aXZlIiwid2Via2l0VHJhbnNmb3JtIiwibXNUcmFuc2Zvcm0iLCJ0cmFuc2Zvcm0iLCJhbGxTbGlkZXMiLCJyZW1haW5kZXIiLCJldmVuQ29lZiIsImluZmluaXRlQ291bnQiLCJjbG9uZSIsInRvZ2dsZSIsInRhcmdldEVsZW1lbnQiLCJwYXJlbnRzIiwic3luYyIsImFuaW1TbGlkZSIsIm9sZFNsaWRlIiwic2xpZGVMZWZ0IiwibmF2VGFyZ2V0Iiwic3dpcGVEaXJlY3Rpb24iLCJ4RGlzdCIsInlEaXN0IiwiciIsInN3aXBlQW5nbGUiLCJzdGFydFgiLCJjdXJYIiwic3RhcnRZIiwiY3VyWSIsImF0YW4yIiwicm91bmQiLCJQSSIsInN3aXBlRW5kIiwic3dpcGVMZW5ndGgiLCJlZGdlSGl0IiwibWluU3dpcGUiLCJmaW5nZXJDb3VudCIsIm9yaWdpbmFsRXZlbnQiLCJ0b3VjaGVzIiwic3dpcGVTdGFydCIsInN3aXBlTW92ZSIsImVkZ2VXYXNIaXQiLCJjdXJMZWZ0IiwicG9zaXRpb25PZmZzZXQiLCJ2ZXJ0aWNhbFN3aXBlTGVuZ3RoIiwicGFnZVgiLCJjbGllbnRYIiwicGFnZVkiLCJjbGllbnRZIiwic3FydCIsInBvdyIsInVuZmlsdGVyU2xpZGVzIiwic2xpY2tVbmZpbHRlciIsImZyb21CcmVha3BvaW50IiwiYXJncyIsIkFycmF5IiwidmFsaWRhdGUiLCJkZWJ1ZyIsIndhcm4iLCJ2YWxpZGF0b3IiLCJvbnN1Ym1pdCIsInN1Ym1pdEJ1dHRvbiIsImNhbmNlbFN1Ym1pdCIsImhhbmRsZSIsInN1Ym1pdEhhbmRsZXIiLCJmb3JtU3VibWl0dGVkIiwiY3VycmVudEZvcm0iLCJmb3JtIiwicGVuZGluZ1JlcXVlc3QiLCJmb2N1c0ludmFsaWQiLCJ2YWxpZCIsImVycm9yTGlzdCIsInJ1bGVzIiwiY29tbWFuZCIsImFyZ3VtZW50IiwiaXNDb250ZW50RWRpdGFibGUiLCJzdGF0aWNSdWxlcyIsImV4aXN0aW5nUnVsZXMiLCJwYXJhbSIsImZpbHRlcmVkIiwibm9ybWFsaXplUnVsZSIsIm5vcm1hbGl6ZVJ1bGVzIiwiY2xhc3NSdWxlcyIsImF0dHJpYnV0ZVJ1bGVzIiwiZGF0YVJ1bGVzIiwicmVxdWlyZWQiLCJyZW1vdGUiLCJleHByIiwicHNldWRvcyIsImJsYW5rIiwidHJpbSIsImZpbGxlZCIsInVuY2hlY2tlZCIsImZvcm1hdCIsInNvdXJjZSIsInBhcmFtcyIsIm1ha2VBcnJheSIsInVuc2hpZnQiLCJncm91cHMiLCJlcnJvckNsYXNzIiwicGVuZGluZ0NsYXNzIiwidmFsaWRDbGFzcyIsImVycm9yRWxlbWVudCIsImZvY3VzQ2xlYW51cCIsImVycm9yQ29udGFpbmVyIiwiZXJyb3JMYWJlbENvbnRhaW5lciIsImlnbm9yZSIsImlnbm9yZVRpdGxlIiwib25mb2N1c2luIiwibGFzdEFjdGl2ZSIsInVuaGlnaGxpZ2h0IiwiaGlkZVRoZXNlIiwiZXJyb3JzRm9yIiwib25mb2N1c291dCIsImNoZWNrYWJsZSIsInN1Ym1pdHRlZCIsIm9wdGlvbmFsIiwib25rZXl1cCIsImV4Y2x1ZGVkS2V5cyIsIndoaWNoIiwiZWxlbWVudFZhbHVlIiwiaW5BcnJheSIsImludmFsaWQiLCJvbmNsaWNrIiwicGFyZW50Tm9kZSIsImhpZ2hsaWdodCIsImZpbmRCeU5hbWUiLCJzZXREZWZhdWx0cyIsImVtYWlsIiwiZGF0ZSIsImRhdGVJU08iLCJudW1iZXIiLCJkaWdpdHMiLCJlcXVhbFRvIiwibWF4bGVuZ3RoIiwibWlubGVuZ3RoIiwicmFuZ2VsZW5ndGgiLCJyYW5nZSIsImF1dG9DcmVhdGVSYW5nZXMiLCJsYWJlbENvbnRhaW5lciIsImVycm9yQ29udGV4dCIsImNvbnRhaW5lcnMiLCJ2YWx1ZUNhY2hlIiwicGVuZGluZyIsInJlc2V0IiwiZGVsZWdhdGUiLCJldmVudFR5cGUiLCJpbnZhbGlkSGFuZGxlciIsImNoZWNrRm9ybSIsImVycm9yTWFwIiwidHJpZ2dlckhhbmRsZXIiLCJzaG93RXJyb3JzIiwicHJlcGFyZUZvcm0iLCJlbGVtZW50cyIsImN1cnJlbnRFbGVtZW50cyIsImNoZWNrIiwiY2xlYW5FbGVtZW50IiwiY2xlYW4iLCJjaGVja0VsZW1lbnQiLCJ2YWxpZGF0aW9uVGFyZ2V0Rm9yIiwidiIsInJzIiwiZ3JvdXAiLCJwcmVwYXJlRWxlbWVudCIsInRlc3Rncm91cCIsIm51bWJlck9mSW52YWxpZHMiLCJ0b0hpZGUiLCJlcnJvcnMiLCJzdWNjZXNzTGlzdCIsImdyZXAiLCJkZWZhdWx0U2hvd0Vycm9ycyIsInJlc2V0Rm9ybSIsImhpZGVFcnJvcnMiLCJyZW1vdmVEYXRhIiwicmVzZXRFbGVtZW50cyIsIm9iamVjdExlbmd0aCIsIm9iaiIsImNvdW50IiwiYWRkV3JhcHBlciIsInNpemUiLCJmaW5kTGFzdEFjdGl2ZSIsInJ1bGVzQ2FjaGUiLCJzZWxlY3RvciIsInJlc2V0SW50ZXJuYWxzIiwidG9TaG93IiwiaWR4IiwidmFsaWRpdHkiLCJiYWRJbnB1dCIsImxhc3RJbmRleE9mIiwicnVsZXNDb3VudCIsImRlcGVuZGVuY3lNaXNtYXRjaCIsInJ1bGUiLCJub3JtYWxpemVyIiwibWV0aG9kcyIsImZvcm1hdEFuZEFkZCIsImlkIiwiVHlwZUVycm9yIiwiY3VzdG9tRGF0YU1lc3NhZ2UiLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInN1YnN0cmluZyIsInRvTG93ZXJDYXNlIiwiY3VzdG9tTWVzc2FnZSIsIlN0cmluZyIsImZpbmREZWZpbmVkIiwiZGVmYXVsdE1lc3NhZ2UiLCJ0aXRsZSIsInRoZXJlZ2V4IiwidG9Ub2dnbGUiLCJ3cmFwcGVyIiwic2hvd0xhYmVsIiwidmFsaWRFbGVtZW50cyIsImludmFsaWRFbGVtZW50cyIsInBsYWNlIiwiZXJyb3JJRCIsImVsZW1lbnRJRCIsImlkT3JOYW1lIiwiZGVzY3JpYmVkQnkiLCJlcnJvclBsYWNlbWVudCIsImVzY2FwZUNzc01ldGEiLCJkZXNjcmliZXIiLCJzdHJpbmciLCJnZXRMZW5ndGgiLCJub2RlTmFtZSIsImRlcGVuZCIsImRlcGVuZFR5cGVzIiwic3RhcnRSZXF1ZXN0Iiwic3RvcFJlcXVlc3QiLCJzdWJtaXQiLCJwcmV2aW91c1ZhbHVlIiwib2xkIiwiY2xhc3NSdWxlU2V0dGluZ3MiLCJjcmVkaXRjYXJkIiwiYWRkQ2xhc3NSdWxlcyIsImNsYXNzTmFtZSIsImNsYXNzZXMiLCJub3JtYWxpemVBdHRyaWJ1dGVSdWxlIiwiZ2V0QXR0cmlidXRlIiwiZGVwZW5kcyIsImtlZXBSdWxlIiwicGFyYW1ldGVyIiwiaXNGdW5jdGlvbiIsInBhcnRzIiwiaXNBcnJheSIsInRyYW5zZm9ybWVkIiwiYWRkTWV0aG9kIiwiY2FsbGVkIiwiRGF0ZSIsInRvU3RyaW5nIiwiZXJyb3JNZXNzYWdlIiwic3VwcG9ydGVkVHlwZXMiLCJyZSIsIm5vdFN1cHBvcnRlZCIsImRlY2ltYWxQbGFjZXMiLCJudW0iLCJ0b0ludCIsImRlY2ltYWxzIiwicHJldmlvdXMiLCJvcHRpb25EYXRhU3RyaW5nIiwib3JpZ2luYWxNZXNzYWdlIiwibW9kZSIsInBvcnQiLCJjb250ZXh0IiwicGVuZGluZ1JlcXVlc3RzIiwiYWpheFByZWZpbHRlciIsInhociIsImFib3J0IiwiYWpheFNldHRpbmdzIiwibWF4V29yZHMiLCJtaW5Xb3JkcyIsInJhbmdlV29yZHMiLCJhY2NlcHQiLCJhbHBoYW51bWVyaWMiLCJiYW5rYWNjb3VudE5MIiwiYmFua29yZ2lyb2FjY291bnROTCIsImJpYyIsImNpZkVTIiwiY3JlZGl0Y2FyZHR5cGVzIiwiY3VycmVuY3kiLCJkYXRlRkEiLCJkYXRlSVRBIiwiZGF0ZU5MIiwiZXh0ZW5zaW9uIiwiZ2lyb2FjY291bnROTCIsImliYW4iLCJpbnRlZ2VyIiwiaXB2NCIsImlwdjYiLCJsZXR0ZXJzb25seSIsImxldHRlcnN3aXRoYmFzaWNwdW5jIiwibW9iaWxlTkwiLCJtb2JpbGVVSyIsIm5pZUVTIiwibmlmRVMiLCJub3doaXRlc3BhY2UiLCJwaG9uZU5MIiwicGhvbmVVSyIsInBob25lVVMiLCJwaG9uZXNVSyIsInBvc3RhbENvZGVDQSIsInBvc3RhbGNvZGVJVCIsInBvc3RhbGNvZGVOTCIsInBvc3Rjb2RlVUsiLCJwb3N0YWxjb2RlQlIiLCJyZXF1aXJlX2Zyb21fZ3JvdXAiLCJza2lwX29yX2ZpbGxfbWluaW11bSIsInN0YXRlVVMiLCJzdHJpcHBlZG1pbmxlbmd0aCIsInRpbWUiLCJ0aW1lMTJoIiwidXJsMiIsInZpblVTIiwiemlwY29kZVVTIiwiemlwcmFuZ2UiLCJjcGZCUiIsIm5pc0JSIiwiY25oQlIiLCJjbnBqQlIiLCJyZWdpc3RlcmVkSW5Nb2R1bGVMb2FkZXIiLCJPbGRDb29raWVzIiwiYXBpIiwibm9Db25mbGljdCIsImF0dHJpYnV0ZXMiLCJkZWNvZGUiLCJzIiwiY29udmVydGVyIiwiZXhwaXJlcyIsInRvVVRDU3RyaW5nIiwid3JpdGUiLCJlbmNvZGVVUklDb21wb25lbnQiLCJlc2NhcGUiLCJzdHJpbmdpZmllZEF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVOYW1lIiwianNvbiIsImphciIsImNvb2tpZXMiLCJyZWFkIiwiZ2V0SlNPTiIsIndpdGhDb252ZXJ0ZXIiLCJTZWFyY2hSZXN1bHQiLCJzZXR1cCIsIiR0b3RhbFNlYXJjaFJlc3VsdCIsIiR0ZXJtc1NlYXJjaFJlc3VsdCIsImdldFRvdGFsU2VhcmNoUmVzdWx0IiwiZ2V0VGVybXNTZWFyY2hSZXN1bHQiLCJBYm91dCIsIkFjY291bnQiLCJDYXJ0TWluaSIsImxvYWRDYXJ0IiwiZXZ0IiwiYWRkUHJvZHVjdCIsInByb2R1Y3QiLCJsaW5rIiwiZGV0YWlsVXJsIiwiaW5mbyIsInNlbGxpbmdQcmljZSIsIm1vbmV5Q29udmVydCIsImxpc3QiLCJudW1iZXJNb2JpbGUiLCJvcGVuQ2xvc2VDYXJ0IiwiQ2F0YWxvZyIsIm51bWJlckNvdW50IiwiZmlsdGVycyIsImJ0biIsImZpbHRlckFjdGl2ZSIsImZpbHRlclR5cGUiLCJmaWx0ZXJNb2JpbGUiLCJmaWx0ZXJBZGRUZXh0IiwiY29udGFpbmVyIiwidG9nZ2xlQ2xhc3MiLCJmaWx0ZXJDbGVhclRleHQiLCJpbnB1dCIsInRleHRFbGVtZW50IiwiY29sb3IiLCJwcmVwZW5kIiwiYnV0dG9uTW9iaWxlIiwiZmlsdGVyTW9iaWxlQWN0aXZlIiwiYnRuTW9yZSIsImZpbHRlclN1YkNhdGVnb3JpZXMiLCJtZW51IiwiZmlsdGVyU3ViQ2F0ZWdvcmllc1JlZmFjdG9yeSIsImZpbHRlclN1YkNhdGVnb3JpZXNSZWZhY3RvcnlHcm91cCIsImVsZW0iLCJtb2JpbGVDaGVja0ZpbHRlciIsIl9oaWRlUmVzdWx0IiwicmVzdWx0SXRlbXMiLCJzdG9wIiwic2xpZGVVcCIsIl9zaG93UmVzdWx0Iiwic2xpZGVEb3duIiwiX3Njcm9sbFRvVG9wUmVzdWx0Iiwic2Nyb2xsVG9wIiwib3JkZXIiLCJTZWxlY3QiLCJTZWFyY2giLCJTaGVsZiIsIkNvbGxlY3Rpb24iLCJjbG9uZVBhZ2VzIiwicmVtb3ZlSGVscGVyQ29tcGxlbWVudCIsImhlYWRlciIsIkhlYWRlciIsIl9pc0xvZ2dlZEluIiwiX25ld3NsZXR0ZXIiLCJTUE1hc2tCZWhhdmlvciIsInNwT3B0aW9ucyIsIm9uS2V5UHJlc3MiLCJmaWVsZCIsIm1hc2siLCJfbmFtZSIsInBob25lIiwiZmlyc3RfbmFtZSIsImxhc3RfbmFtZSIsInBvc3QiLCJoZWFkZXJzIiwicmVzcG9uc2VUZXh0IiwibGFiZWxOdWxsIiwibG9nZ2VkSW4iLCJjbGllbnRQcm9maWxlRGF0YSIsImZpcnN0TmFtZSIsInVzZXIiLCJwcm9wcyIsImNsaWNrSXRlbVN1Ym1lbnUiLCJjbGlja0NvbnRyb2xzRWxlbWVudHMiLCJsb2dvdXQiLCJjaGVja0xvZ2luIiwiY2FydE9wZW4iLCJhZGRFdmVudExpc3RlbmVyIiwib25TY3JvbGwiLCJjYXJ0Q2xpY2tPdXQiLCJwcm9wZXJ0aWVzIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwiY29udHJvbHMiLCJvbkNvbnRyb2xNb2JpbGUiLCJidG5Mb2dvdXQiLCJyZWxvYWQiLCJwYWdlWU9mZnNldCIsImRvY3VtZW50RWxlbWVudCIsIkhvbWUiLCJpbnN0YWdyYW1TdGF0aWMiLCJpbnN0YWdyYW0iLCJ0b2tlbiIsInVzZXJpZCIsIm51bV9waG90b3MiLCJhY2Nlc3NfdG9rZW4iLCJpbWFnZXMiLCJsb3dfcmVzb2x1dGlvbiIsIkxvZ2luIiwiaHJlZiIsIk5lb2FBc2lzdCIsIlByb2R1Y3QiLCJidXlCdXR0b25Db25maXJtIiwicHJvZHVjdEdhbGxlcnkiLCJwcm9kdWN0VmlkZW8iLCJkZXNjcmlwdGlvblByb2R1Y3RUZXh0IiwiZGVzY3JpcHRpb25UYWJzIiwiY29sb3JzVHJhbnNmb3JtIiwic2hhcmVkIiwiY2hhbmdlU2t1Iiwic2hlbGYiLCJza3VQcm9kdWN0IiwiZ2V0VmFyaWF0aW9ucyIsInNrdSIsImFzeW5jIiwiX3RoYXQiLCJjb3IiLCJjdXJyZW50U2t1IiwiY3VycmVudFByb2R1Y3QiLCJwcm9kdWN0SUQiLCJza3VKc29uXzAiLCJwcm9kdWN0SWQiLCJza3VzIiwiZGltZW5zaW9ucyIsIkNvciIsInNrdW5hbWUiLCJidXlFcnJvciIsImJ1eVNlbmQiLCJidG5Db250aW51ZSIsImdldFVybFBhcmFtIiwiZGVmYXVsdHZhbHVlIiwidXJscGFyYW1ldGVyIiwiZ2V0VmFyc1N0cmluZyIsInZhcnMiLCJnZXRJbWFnZXNUaHVtYiIsIlBhdGgiLCJnZXRJbWFnZXNMYXJnZSIsInNrdUpzb24iLCJnZXRTS1VEYXRhIiwiSW1hZ2VzIiwibGFyZ2VIVE1MIiwidGh1bWJzSFRNTCIsInJlZHVjZSIsInByZXZJbWFnZSIsInByb2RJbWFnZSIsInBvcCIsInpvb21VUkwiLCJlYXN5Wm9vbSIsImxvYWRpbmdOb3RpY2UiLCJwcmV2VGh1bWIiLCJ0aHVtYiIsIm9uQWZ0ZXJDaGFuZ2UiLCJtb3VzZWVudGVyIiwiY3VycmVudCIsIml0ZW1JZCIsInZpZGVvIiwiVmlkZW9zIiwidmltZW9WaWRlb0lEIiwidmlkZW9UZW1wbGF0ZSIsInZpbWVvdmlkZW8iLCJ0aHVtYm5haWxfc21hbGwiLCJsYWJlbCIsImRlc2NyaXB0aW9uIiwidGFiIiwiZGVzY3JpcHRpb25UYWJzT3BlbiIsImxpbmtXIiwibGlua0YiLCJsaW5rUCIsIm9wZW4iLCJzY3JvbGxCdXR0b21GdW5jdGlvbiIsInNjcm9sbFRvcEJ1dHRvbSIsInNjcm9sbCIsIm9mZnNldFRvcCIsIlNlYXJjaFBhZ2VFbXB0eSIsInRlcm1TZWFyY2giLCJvbklucHV0Iiwib25TdWJtaXQiLCJnZXRTZWFyY2hQYXJhbXMiLCJrIiwicCIsInRlcm0iLCJTZWFyY2hQYWdlIiwibWFrZUZha2VNdWx0aXBsZU5hdmlnYXRvciIsInRlcm1UZXh0IiwidG90YWxUZXh0IiwidGl0bGVUZXJtIiwiaW5uZXJUZXh0IiwiZGVsYXkiLCJtYXhSb3dzIiwibW9iaWxlQXV0b0NvbXBsZXRlIiwidGh1bWJTaXplIiwiJHNjb3BlIiwiJGlucHV0IiwiJGJ1dHRvbiIsIiRtb2JJc1Zpc2libGUiLCJjbGFzc09wZW4iLCJjbGFzc1RhcmdldCIsImNsYXNzVGFyZ2V0TGlzdCIsImNsYXNzVGFyZ2V0TGlzdEhlYWQiLCJjbGFzc1RhcmdldExpc3RJdGVtIiwiY2xhc3NUYXJnZXRMaXN0SXRlbUltYWdlIiwiY2xhc3NUYXJnZXRMaXN0SXRlbUNhdGVnb3J5IiwiY2xhc3NUYXJnZXRMaXN0TGluayIsImJpbmRDbGlja091dHNpZGUiLCJiaW5kU2VhcmNoU3VibWl0IiwiYmluZFNlYXJjaCIsImJpbmRGb2N1cyIsImJpbmRDbG9zZSIsIiRjbG9zZUJveCIsImhhcyIsImJ1dHRvbkNsb3NlIiwiaW5wdXRPdXRJbkZvY3VzIiwic3VibWl0U2VhcmNoIiwiY29kZSIsIl9pc01vYiIsImdldFNlYXJjaFJlc3VsdCIsInRlcm1zIiwidXJsVGVybXMiLCJlbmNvZGVVUkkiLCJwcm9kdWN0TmFtZUNvbnRhaW5zIiwiY2hlY2tUaXRsZSIsIml0ZW1zUmV0dXJuZWQiLCIkbGlzdFJlc3VsdEhlYWQiLCIkbGlzdFJlc3VsdCIsIiR0aHVtYiIsIl9jaGFuZ2VJbWFnZVNpemUiLCIkY29udGVudFRpdGxlIiwiJGxpbmsiLCJjYXRhbG9nIiwiZ2V0UHJvZHVjdFdpdGhWYXJpYXRpb25zIiwibW9uZXlGb3JtYXQiLCJ0b0ZpeGVkIiwiYXZhaWxhYmxlIiwibGlzdFByaWNlIiwiYmVzdFByaWNlIiwibGlzdFByaWNlRm9ybWF0ZWQiLCJiZXN0UHJpY2VGb3JtYXRlZCIsImluc3RhbGxtZW50cyIsImluc3RhbGxtZW50c1ZhbHVlIiwibmV3U2l6ZSIsImFjdHVhbFNpemUiLCJzZWxlY3RJdGVtcyIsImNyZWF0ZVNlbGVjdEZha2UiLCJzZWxlY3QiLCJzZWxlY3RGYWtlIiwiY3JlYXRlU2VsZWN0RmFrZVRpdGxlIiwiY3JlYXRlU2VsZWN0RmFrZU9wdGlvbnMiLCJjcmVhdGVTZWxlY3RGYWtlQ2xlYXJPcHRpb24iLCJvcHRpb25GYWtlIiwiY29udGVudCIsImVsZW1lbnRPcHRpb24iLCJjaGFuZ2UiLCJvcHRpb25Jbml0IiwidGV4dEluaXQiLCJjbG9zZVNlbGVjdEJvZHkiLCJwYXJlbnRFbGVtZW50IiwiYWpheFN0b3AiLCJza3VCdXR0b24iLCJzcGFjZVJlcGxhY2UiLCJza3VCdXR0b25DbGVhciIsImJ1dHRvbnMiLCJza3VGaW5kIiwic2t1c1Byb2R1Y3QiLCJza3VUZW1wIiwic2t1RmlsdGVyIiwicHJvZHVjdHMiLCJza3VQcm9kdWN0SW5zZXJ0Iiwic2t1c0ZpbHRlciIsIm1vcmVUZXh0IiwiU3RvcmVzIiwidmlkZW9UaHVtYiIsIm1hbmFnZUNvbnRlbnQiLCJiaW5kRXZlbnRzIiwiZmllbGRDbGFzcyIsInBvc2l0aW9uVGh1bWIiLCJ0aGF0IiwiY2xpY2siLCJyZXZlcnNlIiwibGlzdEl0ZW0iLCJuZXdSZWwiLCJyZWwiLCJsaXZlIiwib25lIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTs7QUFFQTs7OztBQUlBO0FBQ0EsQ0FBQyxTQUFTQSxTQUFULEdBQW9CO0FBQ25CLE1BQUlDLGVBQWUsS0FBbkI7QUFBQSxNQUEwQkMsU0FBUyxNQUFNQyxJQUFOLENBQVcsWUFBVTtBQUFDQztBQUFLLEdBQTNCLElBQStCLFlBQS9CLEdBQThDLElBQWpGOztBQUVBO0FBQ0FDLFNBQU9DLFNBQVAsR0FBbUIsWUFBVSxDQUFFLENBQS9COztBQUVBO0FBQ0RBLFlBQVVDLE1BQVYsR0FBbUIsVUFBU0MsSUFBVCxFQUFlO0FBQy9CLFFBQUlDLFNBQVMsS0FBS0MsU0FBbEI7O0FBRUE7QUFDQTtBQUNBVCxtQkFBZSxJQUFmO0FBQ0EsUUFBSVMsWUFBWSxJQUFJLElBQUosRUFBaEI7QUFDQVQsbUJBQWUsS0FBZjs7QUFFQTtBQUNBLFNBQUssSUFBSVUsSUFBVCxJ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QixRQUF4QixFQUFrQ0ssTUFBbEMsR0FBMkMsQ0FBOUMsRUFBaUQ7QUFDN0N6QyxjQUFFRSxRQUFGLEVBQVlpd0MsR0FBWixDQUFnQixVQUFoQixFQUE0QixZQUFXO0FBQ25DbndDLGtCQUFFLEtBQUYsRUFBUzBCLFdBQVQsQ0FBcUIsSUFBckI7QUFDSCxhQUZEO0FBR0g7QUFDSjs7QUFqRnlDLENBQWpCLENBQTNCIiwiZmlsZSI6ImFtaXNzaW1hLWFwcGxpY2F0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsIGRvY3VtZW50ICovXHJcbi8qIGdsb2JhbCB3aW5kb3cgKi9cclxuLyogZ2xvYmFsICQgKi9cclxuXHJcbi8qIFNpbXBsZSBKYXZhU2NyaXB0IEluaGVyaXRhbmNlXHJcbiAqIEJ5IEpvaG4gUmVzaWcgaHR0cDovL2Vqb2huLm9yZy9cclxuICogTUlUIExpY2Vuc2VkLlxyXG4gKi9cclxuLy8gSW5zcGlyZWQgYnkgYmFzZTIgYW5kIFByb3RvdHlwZVxyXG4oZnVuY3Rpb24gdnRleENsYXNzKCl7XHJcbiAgdmFyIGluaXRpYWxpemluZyA9IGZhbHNlLCBmblRlc3QgPSAveHl6Ly50ZXN0KGZ1bmN0aW9uKCl7eHl6O30pID8gL1xcYl9zdXBlclxcYi8gOiAvLiovO1xyXG5cclxuICAvLyBUaGUgYmFzZSBDbGFzcyBpbXBsZW1lbnRhdGlvbiAoZG9lcyBub3RoaW5nKVxyXG4gIHdpbmRvdy5WdGV4Q2xhc3MgPSBmdW5jdGlvbigpe307XHJcblxyXG4gIC8vIENyZWF0ZSBhIG5ldyBDbGFzcyB0aGF0IGluaGVyaXRzIGZyb20gdGhpcyBjbGFzc1xyXG4gVnRleENsYXNzLmV4dGVuZCA9IGZ1bmN0aW9uKHByb3ApIHtcclxuICAgIHZhciBfc3VwZXIgPSB0aGlzLnByb3RvdHlwZTtcclxuXHJcbiAgICAvLyBJbnN0YW50aWF0ZSBhIGJhc2UgY2xhc3MgKGJ1dCBvbmx5IGNyZWF0ZSB0aGUgaW5zdGFuY2UsXHJcbiAgICAvLyBkb24ndCBydW4gdGhlIGluaXQgY29uc3RydWN0b3IpXHJcbiAgICBpbml0aWFsaXppbmcgPSB0cnVlO1xyXG4gICAgdmFyIHByb3RvdHlwZSA9IG5ldyB0aGlzKCk7XHJcbiAgICBpbml0aWFsaXppbmcgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBDb3B5IHRoZSBwcm9wZXJ0aWVzIG92ZXIgb250byB0aGUgbmV3IHByb3RvdHlwZVxyXG4gICAgZm9yICh2YXIgbmFtZSBpbiBwcm9wKSB7XHJcbiAgICAgIC8vIENoZWNrIGlmIHdlJ3JlIG92ZXJ3cml0aW5nIGFuIGV4aXN0aW5nIGZ1bmN0aW9uXHJcbiAgICAgIHByb3RvdHlwZVtuYW1lXSA9IHR5cGVvZiBwcm9wW25hbWVdID09PSBcImZ1bmN0aW9uXCIgJiZcclxuICAgICAgICB0eXBlb2YgX3N1cGVyW25hbWVdID09PSBcImZ1bmN0aW9uXCIgJiYgZm5UZXN0LnRlc3QocHJvcFtuYW1lXSkgP1xyXG4gICAgICAgIChmdW5jdGlvbihuYW1lLCBmbil7XHJcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciB0bXAgPSB0aGlzLl9zdXBlcjtcclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCBhIG5ldyAuX3N1cGVyKCkgbWV0aG9kIHRoYXQgaXMgdGhlIHNhbWUgbWV0aG9kXHJcbiAgICAgICAgICAgIC8vIGJ1dCBvbiB0aGUgc3VwZXItY2xhc3NcclxuICAgICAgICAgICAgdGhpcy5fc3VwZXIgPSBfc3VwZXJbbmFtZV07XHJcblxyXG4gICAgICAgICAgICAvLyBUaGUgbWV0aG9kIG9ubHkgbmVlZCB0byBiZSBib3VuZCB0ZW1wb3JhcmlseSwgc28gd2VcclxuICAgICAgICAgICAgLy8gcmVtb3ZlIGl0IHdoZW4gd2UncmUgZG9uZSBleGVjdXRpbmdcclxuICAgICAgICAgICAgdmFyIHJldCA9IGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgIHRoaXMuX3N1cGVyID0gdG1wO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfSkobmFtZSwgcHJvcFtuYW1lXSkgOlxyXG4gICAgICAgIHByb3BbbmFtZV07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVGhlIGR1bW15IGNsYXNzIGNvbnN0cnVjdG9yXHJcbiAgICBmdW5jdGlvbiBWdGV4Q2xhc3MoKSB7XHJcbiAgICAgIC8vIEFsbCBjb25zdHJ1Y3Rpb24gaXMgYWN0dWFsbHkgZG9uZSBpbiB0aGUgaW5pdCBtZXRob2RcclxuICAgICAgaWYgKCAhaW5pdGlhbGl6aW5nICYmIHRoaXMuaW5pdCApXHJcbiAgICAgICAgdGhpcy5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUG9wdWxhdGUgb3VyIGNvbnN0cnVjdGVkIHByb3RvdHlwZSBvYmplY3RcclxuICAgVnRleENsYXNzLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcclxuXHJcbiAgICAvLyBFbmZvcmNlIHRoZSBjb25zdHJ1Y3RvciB0byBiZSB3aGF0IHdlIGV4cGVjdFxyXG4gICBWdGV4Q2xhc3MucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVnRleENsYXNzO1xyXG5cclxuICAgIC8vIEFuZCBtYWtlIHRoaXMgY2xhc3MgZXh0ZW5kYWJsZVxyXG4gICBWdGV4Q2xhc3MuZXh0ZW5kID0gdnRleENsYXNzO1xyXG5cclxuICAgIHJldHVybiBWdGV4Q2xhc3M7XHJcbiAgfTtcclxufSkoKTtcclxuXHJcbi8qKiBOYW1lc3BhY2UgKiovXHJcbnZhciBBUFAgPSB7XHJcbiAgY29yZToge30sXHJcbiAgY29tcG9uZW50OiB7fSxcclxuICBjb250cm9sbGVyOiB7fSxcclxuICBpOiB7fVxyXG59O1xyXG5cclxuJCh3aW5kb3cpLmxvYWQoZnVuY3Rpb24oKSB7XHJcbiAgLy8gbmV3IEFQUC5jb3JlLk1haW4oKTtcclxufSk7XHJcblxyXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgbmV3IEFQUC5jb3JlLk1haW4oKTtcclxufSk7XHJcblxyXG4vKipcclxuICogVXRpbFxyXG4gKi9cclxuQVBQLmNvcmUuVXRpbCA9IFZ0ZXhDbGFzcy5leHRlbmQoe1xyXG4gIGdldENvbnRyb2xsZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBjb250cm9sbGVyID0gJCgnbWV0YVtuYW1lPWNvbnRyb2xsZXJdJykuYXR0cignY29udGVudCcpO1xyXG4gICAgcmV0dXJuIGNvbnRyb2xsZXIgPyBjb250cm9sbGVyIDogZmFsc2U7XHJcbiAgfVxyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBNYWluXHJcbiAqL1xyXG5BUFAuY29yZS5NYWluID0gVnRleENsYXNzLmV4dGVuZCh7XHJcbiAgaW5pdDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnN0YXJ0KCk7XHJcbiAgfSxcclxuXHJcbiAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgIEFQUC5pLnV0aWwgPSBuZXcgQVBQLmNvcmUuVXRpbCgpO1xyXG4gICAgQVBQLmkuZ2VuZXJhbCA9IG5ldyBBUFAuY29udHJvbGxlci5HZW5lcmFsKCk7XHJcbiAgICB0aGlzLmxvYWRQYWdlQ29udHJvbGxlcigpO1xyXG4gIH0sXHJcblxyXG4gIGxvYWRQYWdlQ29udHJvbGxlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGNvbnRyb2xsZXIgPSBBUFAuaS51dGlsLmdldENvbnRyb2xsZXIoKTtcclxuXHJcbiAgICBpZiAoY29udHJvbGxlcikge1xyXG4gICAgICBBUFAuaS5jdXJyZW50Q29udHJvbGxlciA9IG5ldyBBUFAuY29udHJvbGxlcltjb250cm9sbGVyXSgpO1xyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIi8qKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gT3B0aW9uc1xyXG4gKiBAZXhhbXBsZVxyXG4gKiAkKCdib2R5JykudnRleGNhcnQoe3BhcmFtZXRlcnN9KTtcclxuICovXHJcblxyXG4oZnVuY3Rpb24oJCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgdmFyIHNldHRpbmdzID0ge307XHJcblxyXG4gIHZhciBjYXJ0ID0gbnVsbDtcclxuICB2YXIgaGVscGVyID0ge1xyXG4gICAgb3BlbkNhcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgd2lkdGggPSAkKGNhcnQpLmlubmVyV2lkdGgoKSAqIC0xO1xyXG4gICAgICAkKGNhcnQpLmFuaW1hdGUoe1xyXG4gICAgICAgIHJpZ2h0OiAwXHJcbiAgICAgIH0pO1xyXG4gICAgICAkKCcudnRleC1jYXJ0LW92ZXJsYXknKS5mYWRlSW4oJ3Nsb3cnKTtcclxuICAgICAgJCgnaHRtbCcpLmFkZENsYXNzKCdjYXJ0LWlzLW9wZW4nKTtcclxuICAgIH0sXHJcbiAgICBjbG9zZUNhcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgd2lkdGggPSAkKGNhcnQpLmlubmVyV2lkdGgoKSAqIC0xO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZygnd2lkdGgnLHdpZHRoKTtcclxuICAgICAgJChjYXJ0KS5hbmltYXRlKHtcclxuICAgICAgICAgIHJpZ2h0OiB3aWR0aFxyXG4gICAgICAgIH0sIDUwMCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJCgnLnZ0ZXgtY2FydC1vdmVybGF5JykuZmFkZU91dCgnZmFzdCcpO1xyXG4gICAgICB9KTtcclxuICAgICAgJCgnaHRtbCcpLnJlbW92ZUNsYXNzKCdjYXJ0LWlzLW9wZW4nKTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlsbENhcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2dGV4anMuY2hlY2tvdXQuZ2V0T3JkZXJGb3JtKCkuZG9uZShmdW5jdGlvbihvcmRlckZvcm0pIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnb3JkZXJmb3JtIGZpbGxjYXJ0Jywgb3JkZXJGb3JtKTtcclxuXHJcbiAgICAgICAgLy8gaWYob3JkZXJGb3JtLnRvdGFsaXplcnNbMV0pe1xyXG4gICAgICAgIC8vICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbSgncGZ0eENvdXBvbicpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgdmFyIGl0ZW1zID0gb3JkZXJGb3JtLml0ZW1zO1xyXG4gICAgICAgIHZhciBpO1xyXG5cclxuXHJcblxyXG4gICAgICAgICQoY2FydCkuZmluZCgnLnZ0ZXgtY2FydC1zdWIgc3Ryb25nJykuaHRtbCgnUiQgJyArIGhlbHBlci50b1JlYWwob3JkZXJGb3JtLnRvdGFsaXplcnNbMF0udmFsdWUpKTtcclxuICAgICAgICAkKGNhcnQpLmZpbmQoJy52dGV4LWNhcnQtZGlzY291bnQgc3Ryb25nJykuaHRtbCgnUiQgJyArIGhlbHBlci50b1JlYWwob3JkZXJGb3JtLnRvdGFsaXplcnNbMV0udmFsdWUpKTtcclxuICAgICAgICAkKGNhcnQpLmZpbmQoJy52dGV4LWNhcnQtdG90YWwgc3Ryb25nJykuaHRtbCgnUiQgJyArIGhlbHBlci50b1JlYWwob3JkZXJGb3JtLnZhbHVlKSk7XHJcblxyXG4gICAgICAgICQoJy5oZWFkZXJfX2NvbnRlbnQtLW1pbmljYXJ0LS1saW5rJykuYXR0cignZGF0YS1xdWFudGl0eScsaXRlbXMubGVuZ3RoKTtcclxuXHJcbiAgICAgICAgJChjYXJ0KS5maW5kKCd1bCcpLmh0bWwoJycpO1xyXG5cclxuICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICAgICQoJy52dGV4LWNhcnQtcmVzdW1lIGEnKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcclxuXHJcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdpdGVtc1tpXScsIGl0ZW1zW2ldKTtcclxuXHJcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICc8bGk+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICc8YnV0dG9uIGNsYXNzPVwicmVtb3ZlLWl0ZW1cIiBkYXRhLWluZGV4PVwiJyArIGkgKyAnXCI+PC9idXR0b24+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJ2dGV4LWNhcnQtcGR0LWltYWdlXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxpbWcgc3JjPVwiJyArIGl0ZW1zW2ldLmltYWdlVXJsICsgJ1wiIC8+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwidnRleC1jYXJ0LXBkdC10aXRsZVwiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICc8aDQ+JyArIGl0ZW1zW2ldLm5hbWUgKyAnPC9oND4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwidnRleC1jYXJ0LXBkdC1pbmZvXCI+JytcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vUXR5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwidnRleC1jYXJ0LXBkdC1xdGRcIj4nK1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsaXN0LWNvdW50IGxpc3QtY291bnQtY2FydFwiIGRhdGEtaW5kZXg9XCInICsgaSArICdcIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJtaW51c1wiPjxhIGhyZWY9XCIjXCIgY2xhc3M9XCJxdHktbGVzc1wiPjwvYT48L2Rpdj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJyZXN1bHRcIj48aW5wdXQgdHlwZT1cInRleHRcIiB2YWx1ZT1cIicgKyBpdGVtc1tpXS5xdWFudGl0eSArICdcIiBuYW1lPVwicXVhbnRpdHlcIiBjbGFzcz1cInF0eS1maWVsZCBmaWVsZFwiIG1pbj1cIjFcIiBtYXg9XCIxMDBcIiBzdGVwPVwiMVwiIGRpc2FibGVkLz48L2Rpdj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJwbHVzXCI+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInF0eS1tb3JlXCI+PC9hPjwvZGl2PicgK1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAvL0VuZCBRdHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxwPlIkICcgKyBoZWxwZXIudG9SZWFsKGl0ZW1zW2ldLnByaWNlKSArICc8L3A+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2xpPic7XHJcblxyXG5cclxuXHJcbiAgICAgICAgICAgICQoY2FydCkuZmluZCgndWwnKS5hcHBlbmQodGVtcGxhdGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAkKCcudnRleC1jYXJ0LXJlc3VtZSAudnRleC1jYXJ0LXNlbmQtcmVxdWVzdCcpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xyXG4gICAgICAgICAgJChjYXJ0KS5maW5kKCcudnRleC1jYXJ0LWl0ZW1zJykuYXBwZW5kKCc8c3BhbiBjbGFzcz1cInZ0ZXgtY2FydC1pdGVtcy0tZW1wdHlcIj5TdWEgc2Fjb2xhIGVzdMOhIHZhemlhPC9zcGFuPicpO1xyXG4gICAgICAgICAgLy8gaGVscGVyLmNsb3NlQ2FydCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgYWRkSXRlbTogZnVuY3Rpb24oZWwpIHtcclxuICAgICAgdmFyIHVybFRlc3QgPSBbXCJqYXZhc2NyaXB0XCIsIFwiOlwiLCBcImFsZXJ0KCdQb3IgZmF2b3IsIHNlbGVjaW9uZSBvIG1vZGVsbyBkZXNlamFkby4nKTtcIl0uam9pbignJyk7XHJcbiAgICAgIHZhciB1cmwgPSAkKGVsKS5hdHRyKCdocmVmJyk7XHJcblxyXG4gICAgICBpZiAodXJsID09IHVybFRlc3QpIHtcclxuICAgICAgICBhbGVydCgnUG9yIGZhdm9yLCBzZWxlY2lvbmUgbyBtb2RlbG8gZGVzZWphZG8uJyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGhlbHBlci5vcGVuQ2FydCgpO1xyXG5cclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgdXJsOiB1cmwucmVwbGFjZSgndHJ1ZScsICdmYWxzZScpLFxyXG4gICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICBjcm9zc0RvbWFpbjogdHJ1ZSxcclxuICAgICAgICAgIGRhdGFUeXBlOiAnaHRtbCcsXHJcbiAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaGVscGVyLmZpbGxDYXJ0KCk7XHJcblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJlbW92ZUl0ZW06IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgIGlmIChjb25maXJtKCdEZXNlamEgcmVhbG1lbnRlIHJlbW92ZXIgbyBpdGVtIGRvIGNhcnJpbmhvPycpKSB7XHJcbiAgICAgICAgdnRleGpzLmNoZWNrb3V0LmdldE9yZGVyRm9ybSgpLnRoZW4oZnVuY3Rpb24ob3JkZXJGb3JtKSB7XHJcbiAgICAgICAgICB2YXIgaXRlbSA9IG9yZGVyRm9ybS5pdGVtc1tpbmRleF07XHJcbiAgICAgICAgICBpdGVtLmluZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgICByZXR1cm4gdnRleGpzLmNoZWNrb3V0LnJlbW92ZUl0ZW1zKFtpdGVtXSk7XHJcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihvcmRlckZvcm0pIHtcclxuICAgICAgICAgIGhlbHBlci5maWxsQ2FydCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNoYW5nZUl0ZW06IGZ1bmN0aW9uKGl0ZW1JbmRleCwgcXVhbnRpdHkpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnaXRlbUluZGV4JyxpdGVtSW5kZXgpO1xyXG4gICAgICAgIHZ0ZXhqcy5jaGVja291dC5nZXRPcmRlckZvcm0oKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgdmFyIHVwZGF0ZUl0ZW0gPSB7XHJcbiAgICAgICAgICAgICAgaW5kZXg6IHBhcnNlSW50KGl0ZW1JbmRleCksXHJcbiAgICAgICAgICAgICAgcXVhbnRpdHk6IHBhcnNlSW50KHF1YW50aXR5KVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdnRleGpzLmNoZWNrb3V0LnVwZGF0ZUl0ZW1zKFt1cGRhdGVJdGVtXSwgbnVsbCwgZmFsc2UpO1xyXG5cclxuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBoZWxwZXIuZmlsbENhcnQoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9LFxyXG5cclxuICAgIHRvUmVhbDogZnVuY3Rpb24oaW50KSB7XHJcbiAgICAgIGlmKGludCA8IDApe1xyXG4gICAgICAgIHZhciB0bXAgPSAoaW50Ki0xKSsnJztcclxuICAgICAgICAgIHRtcCA9IHRtcC5yZXBsYWNlKC8oWzAtOV17Mn0pJC9nLCBcIiwkMVwiKTtcclxuICAgICAgICAgIGlmKCB0bXAubGVuZ3RoID4gNiApXHJcbiAgICAgICAgICAgICAgICAgIHRtcCA9IHRtcC5yZXBsYWNlKC8oWzAtOV17M30pLChbMC05XXsyfSQpL2csIFwiLiQxLCQyXCIpO1xyXG5cclxuICAgICAgICAgIHJldHVybiAnLScgKyB0bXA7XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIHZhciB0bXAgPSBpbnQrJyc7XHJcbiAgICAgICAgdG1wID0gdG1wLnJlcGxhY2UoLyhbMC05XXsyfSkkL2csIFwiLCQxXCIpO1xyXG4gICAgICAgIGlmKCB0bXAubGVuZ3RoID4gNiApXHJcbiAgICAgICAgICAgICAgICB0bXAgPSB0bXAucmVwbGFjZSgvKFswLTldezN9KSwoWzAtOV17Mn0kKS9nLCBcIi4kMSwkMlwiKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRtcDtcclxuICAgICAgfVxyXG5cclxuXHJcbiAgICB9LFxyXG4gICAgY291cG9uOiBmdW5jdGlvbigpe1xyXG4gICAgICAvKlxyXG4gICAgICBGb3JtIGNvdXBvblxyXG4gICAgICAgKi9cclxuICAgICAgJChkb2N1bWVudCkuZmluZCgnLnZ0ZXgtY2FydC1jb3Vwb24nKS5vbignc3VibWl0JywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHZhciBkaXNjb3VudENvdXBvbiA9ICQodGhpcykuZmluZCgnLnZ0ZXgtY2FydC1jb3Vwb24taW5wdXQnKS52YWwoKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnZGlzY291bnRDb3Vwb24nLGRpc2NvdW50Q291cG9uKTtcclxuICAgICAgICBoZWxwZXIuYWRkQ291cG9uKGRpc2NvdW50Q291cG9uKTtcclxuICAgICAgfSk7XHJcbiAgICAgIC8qXHJcbiAgICAgIFJlbW92ZSBjb3Vwb25cclxuICAgICAgICovXHJcbiAgICAgICQoZG9jdW1lbnQpLmZpbmQoJy52dGV4LWNhcnQtY291cG9uLWluZm8tcmVtb3ZlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGhlbHBlci5yZW1vdmVDb3Vwb24oKTtcclxuICAgICAgICByZXR1cm4gdnRleGpzLmNoZWNrb3V0LmNsZWFyTWVzc2FnZXMoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvKlxyXG4gICAgICBWZXJpZnkgY291cG9uXHJcbiAgICAgICAqL1xyXG4gICAgICB2YXIgZGF0YSA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ3BmdHhDb3Vwb24nKTtcclxuICAgICAgaWYoZGF0YSl7XHJcbiAgICAgICAgJCgnLnZ0ZXgtY2FydC1jb3Vwb24nKS5oaWRlKCk7XHJcbiAgICAgICAgJCgnLnZ0ZXgtY2FydC1jb3Vwb24taW5mbycpLnNob3coKTtcclxuICAgICAgICAkKCcudnRleC1jYXJ0LWNvdXBvbi1pbmZvJykuZmluZCgnLnZ0ZXgtY2FydC1jb3Vwb24tdmFsdWUnKS5odG1sKGRhdGEpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuICAgIGFkZENvdXBvbjogZnVuY3Rpb24oY291cG9uKXtcclxuICAgICAgdnRleGpzLmNoZWNrb3V0LmdldE9yZGVyRm9ybSgpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ob3JkZXJGb3JtKSB7XHJcbiAgICAgICAgICByZXR1cm4gdnRleGpzLmNoZWNrb3V0LmFkZERpc2NvdW50Q291cG9uKGNvdXBvbik7XHJcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbihvcmRlckZvcm0pIHtcclxuICAgICAgICAgIHZhciBtc2dMZW5ndGggPSBvcmRlckZvcm0ubWVzc2FnZXMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdvcmRlckZvcm0ubWVzc2FnZXMnLG9yZGVyRm9ybS5tZXNzYWdlcyk7XHJcblxyXG4gICAgICAgICAgaWYobXNnTGVuZ3RoKXtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IG9yZGVyRm9ybS5tZXNzYWdlc1swXS50ZXh0O1xyXG4gICAgICAgICAgICAvLyBhbGVydChtc2cpO1xyXG4gICAgICAgICAgICBhbGVydCgnT3BzISBBbGdvIGRldSBlcnJhZG8uJyk7XHJcbiAgICAgICAgICAgIHJldHVybiB2dGV4anMuY2hlY2tvdXQuY2xlYXJNZXNzYWdlcygpO1xyXG4gICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGFsZXJ0KCdDdXBvbSBhZGljaW9uYWRvIScpO1xyXG4gICAgICAgICAgICAkKCcudnRleC1jYXJ0LWNvdXBvbicpLmhpZGUoKTtcclxuICAgICAgICAgICAgJCgnLnZ0ZXgtY2FydC1jb3Vwb24taW5mbycpLnNob3coKTtcclxuICAgICAgICAgICAgJCgnLnZ0ZXgtY2FydC1jb3Vwb24taW5mbycpLmZpbmQoJy52dGV4LWNhcnQtY291cG9uLXZhbHVlJykuaHRtbChjb3Vwb24pO1xyXG4gICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCdwZnR4Q291cG9uJywgY291cG9uKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBoZWxwZXIuZmlsbENhcnQoKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICByZW1vdmVDb3Vwb246IGZ1bmN0aW9uKCl7XHJcbiAgICAgIHZ0ZXhqcy5jaGVja291dC5nZXRPcmRlckZvcm0oKVxyXG4gICAgICAudGhlbihmdW5jdGlvbihvcmRlckZvcm0pIHtcclxuICAgICAgICByZXR1cm4gdnRleGpzLmNoZWNrb3V0LnJlbW92ZURpc2NvdW50Q291cG9uKCk7XHJcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24ob3JkZXJGb3JtKSB7XHJcbiAgICAgICAgYWxlcnQoJ0N1cG9tIHJlbW92aWRvLicpO1xyXG4gICAgICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oJ3BmdHhDb3Vwb24nKTtcclxuICAgICAgICAkKCcudnRleC1jYXJ0LWNvdXBvbicpLnNob3coKTtcclxuICAgICAgICAkKCcudnRleC1jYXJ0LWNvdXBvbi1pbmZvJykuaGlkZSgpO1xyXG4gICAgICAgIGhlbHBlci5maWxsQ2FydCgpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKG9yZGVyRm9ybSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKlxyXG4gICAgU2hpcHBpbmdcclxuICAgICAqL1xyXG4gICAgc2hpcHBpbmc6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICQoJy52dGV4LWNhcnQtZnJlaWdodCcpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbihlKXtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdmFyIHBvc3RhbENvZGUgPSAkKHRoaXMpLmZpbmQoJ2lucHV0W3R5cGU9XCJ0ZXh0XCJdJykudmFsKCk7XHJcbiAgICAgICAgaGVscGVyLmNhbGN1bGF0ZVNoaXBwaW5nKHBvc3RhbENvZGUpO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBjYWxjdWxhdGVTaGlwcGluZzogZnVuY3Rpb24ocG9zdGFsQ29kZSl7XHJcbiAgICAgIHZ0ZXhqcy5jaGVja291dC5nZXRPcmRlckZvcm0oKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyRm9ybSkge1xyXG4gICAgICAgICAgaWYgKHBvc3RhbENvZGUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgdmFyIGFkZHJlc3MgPSB7XHJcbiAgICAgICAgICAgICAgXCJwb3N0YWxDb2RlXCI6IHBvc3RhbENvZGUsXHJcbiAgICAgICAgICAgICAgXCJjb3VudHJ5XCI6ICdCUkEnXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJldHVybiB2dGV4anMuY2hlY2tvdXQuY2FsY3VsYXRlU2hpcHBpbmcoYWRkcmVzcyk7XHJcbiAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZG9uZShmdW5jdGlvbihvcmRlckZvcm0pIHtcclxuICAgICAgICAgIGFsZXJ0KCdGcmV0ZSBjYWxjdWxhZG8uJyk7XHJcbiAgICAgICAgICBoZWxwZXIuZmlsbENhcnQoKTtcclxuICAgICAgICAgIC8vIGhlbHBlci5zZXRBZGRyZXNzKHBvc3RhbENvZGUpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ29yZGVyRm9ybS5zaGlwcGluZ0RhdGEnLG9yZGVyRm9ybS5zaGlwcGluZ0RhdGEpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ29yZGVyRm9ybS50b3RhbGl6ZXJzJyxvcmRlckZvcm0udG90YWxpemVycyk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIHNldEFkZHJlc3M6IGZ1bmN0aW9uKHBvc3RhbENvZGUpe1xyXG4gICAgICBjb25zb2xlLmxvZygncG9zdGFsQ29kZScscG9zdGFsQ29kZSk7XHJcblxyXG4gICAgICB2dGV4anMuY2hlY2tvdXQuZ2V0T3JkZXJGb3JtKCkudGhlbihmdW5jdGlvbihvcmRlckZvcm0pIHtcclxuXHRcdFx0Y29uc29sZS5sb2cob3JkZXJGb3JtKTtcclxuXHRcdFx0aWYgKHBvc3RhbENvZGUgIT09IG51bGwpIHtcclxuXHRcdFx0XHR2YXIgZGF0YSA9IHtcclxuXHRcdFx0XHRcdFwicG9zdGFsQ29kZVwiOiBwb3N0YWxDb2RlLFxyXG5cdFx0XHRcdFx0XCJjb3VudHJ5XCI6ICdCUkEnXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHR2dGV4anMuY2hlY2tvdXQuY2FsY3VsYXRlU2hpcHBpbmcoZGF0YSkudGhlbihmdW5jdGlvbihvcmRlckZvcm0pe1xyXG4gICAgICAgICAgICB2YXIgbG9naXN0aWMgPSBvcmRlckZvcm0ubG9naXN0aWNzSW5mbztcclxuXHRcdFx0XHRcdCAgdmFyIHNkID0gb3JkZXJGb3JtLnNoaXBwaW5nRGF0YTtcclxuXHRcdFx0XHQgICAgdmFyIGRlbGl2ZXJ5T3B0aW9uID0gSlNPTi5wYXJzZShzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKCdwZnR4LWRlbGl2ZXJ5Q2hhbm5lbENvbnRlbnQnKSkgfHwgZmFsc2U7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzZCcsc2QpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnbG9naXN0aWMnLGxvZ2lzdGljKTtcclxuXHRcdFx0XHRcdGlmKGRlbGl2ZXJ5T3B0aW9uKSB7XHJcblx0XHRcdFx0ICAgICAgICBzZC5sb2dpc3RpY3NJbmZvWzBdLnNlbGVjdGVkRGVsaXZlcnlDaGFubmVsID0gZGVsaXZlcnlPcHRpb24uZGVsaXZlcnlDaGFubmVsO1xyXG5cdFx0XHRcdCAgICAgICAgc2QubG9naXN0aWNzSW5mb1swXS5zZWxlY3RlZFNsYSA9IGRlbGl2ZXJ5T3B0aW9uLm5hbWU7XHJcblxyXG5cdFx0XHRcdCAgICAgICAgdnRleGpzLmNoZWNrb3V0LnNlbmRBdHRhY2htZW50KCdzaGlwcGluZ0RhdGEnLCBzZCkudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0ICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XHJcblx0XHRcdFx0ICAgICAgICB9KTtcclxuXHRcdFx0XHQgICAgfVxyXG5cdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdC8vIHZ0ZXhqcy5jaGVja291dC5yZW1vdmVBbGxJdGVtcygpLnRoZW4oZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0Ly8gXHRsb2NhdGlvbi5ocmVmID0gXCIvXCI7XHJcblx0XHRcdFx0XHRcdC8vIH0pO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgJC5mbi52dGV4Y2FydCA9IGZ1bmN0aW9uKHBhcmFtZXRlcnMpIHtcclxuXHJcbiAgICB2YXIgZWwgPSB0aGlzO1xyXG5cclxuICAgIHNldHRpbmdzID0gJC5leHRlbmQoc2V0dGluZ3MsIHBhcmFtZXRlcnMpO1xyXG5cclxuICAgIHZhciBjYXJ0SHRtbCA9ICAnPGRpdiBjbGFzcz1cInZ0ZXgtY2FydC1vdmVybGF5XCI+PC9kaXY+JytcclxuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInZ0ZXgtY2FydC1jb250YWluZXJcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwidnRleC1jYXJ0LXRpdGxlXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAnPGJ1dHRvbiBjbGFzcz1cInZ0ZXgtY2FydC1jbG9zZVwiPjwvYnV0dG9uPicrXHJcbiAgICAgICAgICAgICAgICAgICAgJzxoMz5NaW5oYSBzYWNvbGE8L2gzPicrXHJcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJ2dGV4LWNhcnQtaXRlbXNcIj4gPHVsPjwvdWw+IDwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJ2dGV4LWNhcnQtcmVzdW1lXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAvLyAnPGZvcm0gY2xhc3M9XCJ2dGV4LWNhcnQtZnJlaWdodFwiIGFjdGlvbj1cIlwiPkZyZXRlPHN0cm9uZyBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjA8L3N0cm9uZz48aW5wdXQgdHlwZT1cInRleHRcIiAvPjxidXR0b24gdHlwZT1cInN1Ym1pdFwiPkNhbGN1bGFyPC9idXR0b24+PC9mb3JtPicrXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwidnRleC1jYXJ0LWNvdXBvbi1pbmZvXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPjxzcGFuIGNsYXNzPVwidnRleC1jYXJ0LWNvdXBvbi12YWx1ZVwiPjwvc3Bhbj48YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApO1wiIGNsYXNzPVwidnRleC1jYXJ0LWNvdXBvbi1pbmZvLXJlbW92ZVwiPmV4Y2x1aXI8L2E+PC9kaXY+JytcclxuICAgICAgICAgICAgICAgICAgICAnPGZvcm0gYWN0aW9uPVwiXCIgY2xhc3M9XCJ2dGV4LWNhcnQtY291cG9uXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAnPHNwYW4+Q3Vwb20gZGUgZGVzY29udG88L3NwYW4+JytcclxuICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJ2dGV4LWNhcnQtY291cG9uLWlucHV0XCIgcGxhY2Vob2xkZXI9XCJDw7NkaWdvXCI+PGJ1dHRvbiB0eXBlPVwic3VibWl0XCIgY2xhc3M9XCJ2dGV4LWNhcnQtY291cG9uLWFkZFwiPkFkaWNpb25hcjwvYnV0dG9uPicrXHJcbiAgICAgICAgICAgICAgICAgICAgJzwvZm9ybT4nK1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ2dGV4LWNhcnQtc3ViXCI+U3VidG90YWw8c3Ryb25nPlIkIDAsMDA8L3N0cm9uZz48L3NwYW4+JytcclxuICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ2dGV4LWNhcnQtZGlzY291bnRcIj5EZXNjb250b3M8c3Ryb25nPlIkIDAsMDA8L3N0cm9uZz48L3NwYW4+JytcclxuICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJ2dGV4LWNhcnQtdG90YWxcIj5Ub3RhbDxzdHJvbmc+UiQgMCwwMDwvc3Ryb25nPjwvc3Bhbj4nK1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAnPGEgaHJlZj1cIi9jaGVja291dC8jL2VtYWlsXCIgY2xhc3M9XCJ2dGV4LWNhcnQtc2VuZC1yZXF1ZXN0XCI+RmVjaGFyIHBlZGlkbzwvYT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICc8YSBocmVmPVwiI1wiIGNsYXNzPVwidnRleC1jYXJ0LWJhY2stdG8tc2hvcFwiPkVzY29saGVyIG1haXMgcHJvZHV0b3M8L2E+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JztcclxuXHJcbiAgICB2YXIgbWluaUNhcnRIdG1sID0gJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJvcGVuQ2FydFwiPjxzcGFuPjwvc3Bhbj48L2E+JztcclxuXHJcbiAgICAkKGVsKS5hcHBlbmQoY2FydEh0bWwpO1xyXG5cclxuICAgIGlmIChzZXR0aW5ncy5jYXJ0QnV0dG9uKSB7XHJcbiAgICAgICQoc2V0dGluZ3MuY2FydEJ1dHRvbikuYXBwZW5kKG1pbmlDYXJ0SHRtbCk7XHJcbiAgICB9XHJcblxyXG4gICAgY2FydCA9ICQoZWwpLmZpbmQoJy52dGV4LWNhcnQtY29udGFpbmVyJyk7XHJcblxyXG4gICAgaGVscGVyLmZpbGxDYXJ0KCk7XHJcbiAgICBoZWxwZXIuY291cG9uKCk7XHJcbiAgICBoZWxwZXIuc2hpcHBpbmcoKTtcclxuXHJcbiAgICAvKlxyXG4gICAgRElSRUNUSVZFU1xyXG4gICAgICovXHJcblxyXG4gICAgJChzZXR0aW5ncy5idXlCdXR0b24pLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgIGhlbHBlci5hZGRJdGVtKCQodGhpcykpO1xyXG5cclxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgICQoJy5oZWFkZXJfX2NvbnRlbnQtLW1pbmljYXJ0LS1saW5rJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgaGVscGVyLm9wZW5DYXJ0KCk7XHJcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAkKCcudnRleC1jYXJ0LWNsb3NlLCAudnRleC1jYXJ0LW92ZXJsYXksIC52dGV4LWNhcnQtYmFjay10by1zaG9wJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgaGVscGVyLmNsb3NlQ2FydCgpO1xyXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgJChkb2N1bWVudCkua2V5ZG93bihmdW5jdGlvbihldmVudCkge1xyXG4gICAgICBpZiAoJCgnaHRtbCcpLmhhc0NsYXNzKCdjYXJ0LWlzLW9wZW4nKSkge1xyXG4gICAgICAgIGlmICgoZXZlbnQua2V5ID09ICdFc2NhcGUnIHx8IGV2ZW50LmtleSA9PSAnRXNjJyB8fCBldmVudC5rZXlDb2RlID09IDI3KSkge1xyXG4gICAgICAgICAgaGVscGVyLmNsb3NlQ2FydCgpO1xyXG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAkKFwiLnZ0ZXgtY2FydC1jb250YWluZXJcIikub24oXCJjbGlja1wiLCBcIi5saXN0LWNvdW50LWNhcnQgYVwiLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2NoYW5nZSBxdHknKTtcclxuICAgICAgICB2YXIgYnRuQWN0aW9uID0gJCh0aGlzKVxyXG4gICAgICAgICAgLCBkYXRhSW5kZXggPSBidG5BY3Rpb24uY2xvc2VzdChcIi5saXN0LWNvdW50LWNhcnRcIikuYXR0cihcImRhdGEtaW5kZXhcIilcclxuICAgICAgICAgICwgcXR5RmllbGQgPSBidG5BY3Rpb24uY2xvc2VzdChcIi5saXN0LWNvdW50LWNhcnRcIikuZmluZChcIi5xdHktZmllbGRcIilcclxuICAgICAgICAgICwgcXVhbnRpdHkgPSBwYXJzZUludChxdHlGaWVsZC52YWwoKSwgMTApIHx8IDBcclxuICAgICAgICAgICwgcXR5TWluID0gcXR5RmllbGQuYXR0cihcIm1pblwiKVxyXG4gICAgICAgICAgLCBxdHlNYXggPSBxdHlGaWVsZC5hdHRyKFwibWF4XCIpO1xyXG4gICAgICAgIGJ0bkFjdGlvbi5oYXNDbGFzcyhcInF0eS1sZXNzXCIpID8gcXVhbnRpdHkgIT0gcXR5TWluICYmIHF1YW50aXR5LS0gOiBxdHlNYXggPiBxdWFudGl0eSAmJiBxdWFudGl0eSsrLFxyXG4gICAgICAgIGhlbHBlci5jaGFuZ2VJdGVtKGRhdGFJbmRleCwgcXVhbnRpdHkpXHJcbiAgICB9KSxcclxuXHJcblxyXG5cclxuICAgICQoJy52dGV4LWNhcnQtY29udGFpbmVyJykub24oJ2NsaWNrJywgJy5yZW1vdmUtaXRlbScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgaW5kZXggPSAkKHRoaXMpLmRhdGEoJ2luZGV4Jyk7XHJcbiAgICAgIGhlbHBlci5yZW1vdmVJdGVtKGluZGV4KTtcclxuICAgIH0pO1xyXG5cclxuICAgICQoJy52dGV4LWNhcnQtcmVzdW1lIGEnKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKCQodGhpcykuaGFzQ2xhc3MoJ2Rpc2FibGVkJykpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG5cclxuXHJcbn0oalF1ZXJ5KSk7XHJcbiIsIi8qIVxyXG4gKiBWdGV4IFNlYXJjaFxyXG4gKiBMaWNlbnNlZCBNSVRcclxuICovXHJcblxyXG47KGZ1bmN0aW9uICgkKSB7XHJcbiAgd2luZG93LlZ0ZXhTZWFyY2ggPSB7XHJcbiAgICAvLyAgXyAgICAgICBfIF9cclxuICAgIC8vIChfKV8gX18gKF8pIHxfXHJcbiAgICAvLyB8IHwgJ18gXFx8IHwgX198XHJcbiAgICAvLyB8IHwgfCB8IHwgfCB8X1xyXG4gICAgLy8gfF98X3wgfF98X3xcXF9ffFxyXG4gICAgLy9cclxuXHJcbiAgICBpbml0OiBmdW5jdGlvbiAoJHJlc3VsdCwgc2V0dGluZ3MpIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgc2VsZi5vcHRpb25zID0gJC5leHRlbmQoc2VsZi5nZXREZWZhdWx0T3B0aW9ucygpLCBzZXR0aW5ncyk7XHJcbiAgICAgIHNlbGYub3B0aW9ucy4kcmVzdWx0ID0gJHJlc3VsdDtcclxuXHJcbiAgICAgIHNlbGYuc3RhcnQoKTtcclxuICAgICAgc2VsZi5iaW5kKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgIHNlbGYucmVxdWVzdCA9IHNlbGYuX3NldFJlcXVlc3QoKTtcclxuICAgICAgc2VsZi5fY29uY2F0UmVxdWVzdCgpO1xyXG4gICAgICBzZWxmLl9zZXRQYWdpbmF0aW9uSW5mbygpO1xyXG5cclxuICAgICAgc2VsZi5vcHRpb25zLnBhZ2luYXRpb24gJiYgc2VsZi5fc2V0UGFnaW5hdGlvbldyYXAoKTtcclxuXHJcbiAgICAgIHNlbGYuX2NyZWF0ZUJ1dHRvbnMoKTtcclxuXHJcbiAgICAgIHNlbGYuY2hlY2tBbmRTdGFydCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfY3JlYXRlQnV0dG9uczogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAkKCcucmVzdWx0SXRlbXNXcmFwcGVyIGRpdltpZF49UmVzdWx0SXRlbXNdJylcclxuICAgICAgICAuYmVmb3JlKCc8YnV0dG9uIGNsYXNzPVwiJysgc2VsZi5vcHRpb25zLmNsYXNzTG9hZExlc3MgKycgJysgc2VsZi5vcHRpb25zLmNsYXNzTG9hZEJ0bkhpZGUgKydcIj4nKyBzZWxmLm9wdGlvbnMudGV4dExvYWRMZXNzICsnPC9idXR0b24+JylcclxuICAgICAgICAuYWZ0ZXIoJzxidXR0b24gY2xhc3M9XCInKyBzZWxmLm9wdGlvbnMuY2xhc3NMb2FkTW9yZSArJ1wiPicrIHNlbGYub3B0aW9ucy50ZXh0TG9hZE1vcmUgKyc8L2J1dHRvbj4nKTtcclxuICAgIH0sXHJcblxyXG4gICAgX3NldFBhZ2luYXRpb25XcmFwOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgIHZhciAkcGFnaW5hdGlvbiA9ICQoJzxkaXYgLz4nLCB7XHJcbiAgICAgICAgY2xhc3M6IHNlbGYub3B0aW9ucy5jbGFzc1BhZ2luYXRpb25cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBzZWxmLm9wdGlvbnMuJHBhZ2VyLmFmdGVyKCRwYWdpbmF0aW9uKTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8vICAgICAgIF8gICAgICAgICAgICAgICBfXHJcbiAgICAvLyAgIF9fX3wgfF9fICAgX19fICBfX198IHwgX19cclxuICAgIC8vICAvIF9ffCAnXyBcXCAvIF8gXFwvIF9ffCB8LyAvXHJcbiAgICAvLyB8IChfX3wgfCB8IHwgIF9fLyAoX198ICAgPFxyXG4gICAgLy8gIFxcX19ffF98IHxffFxcX19ffFxcX19ffF98XFxfXFxcclxuICAgIC8vXHJcblxyXG4gICAgY2hlY2tBbmRTdGFydDogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBzZWxmLl9jaGVja1JlcXVlc3RXaXRoQ29va2llKCkgP1xyXG4gICAgICAgIHNlbGYuc3RhcnRXaXRoQ29va2llKCkgOiBzZWxmLnN0YXJ0V2l0aG91dENvb2tpZSgpO1xyXG5cclxuICAgICAgc2VsZi5vcHRpb25zLiRyZXN1bHQudHJpZ2dlcigndnRleHNlYXJjaC5pbml0JywgWyBzZWxmLm9wdGlvbnMsIHNlbGYucmVxdWVzdCBdKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2NoZWNrUmVxdWVzdFdpdGhDb29raWU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgaWYgKHR5cGVvZiBDb29raWVzID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IG5lZWQgaW5zdGFsbCB0aGlzIHBsdWdpbiBodHRwczovL2dpdGh1Yi5jb20vanMtY29va2llL2pzLWNvb2tpZScpO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBoYXNoID0gcGFyc2VJbnQod2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyKDEpKTtcclxuICAgICAgdmFyIGNvb2tpZSA9IENvb2tpZXMuZ2V0KHNlbGYub3B0aW9ucy5jb29raWVOYW1lKTtcclxuXHJcbiAgICAgIGlmICh0eXBlb2YgY29va2llID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGNvb2tpZVJlcXVlc3QgPSBKU09OLnBhcnNlKGNvb2tpZSk7XHJcbiAgICAgIHZhciBsb2NhbFJlcXVlc3QgPSAkLmV4dGVuZCh7fSwgc2VsZi5yZXF1ZXN0KTtcclxuXHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgIWlzTmFOKGhhc2gpICYmXHJcbiAgICAgICAgdHlwZW9mIGNvb2tpZVJlcXVlc3QgIT09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgbG9jYWxSZXF1ZXN0LnBhdGggPT09IGNvb2tpZVJlcXVlc3QucGF0aFxyXG4gICAgICApO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLy8gICAgICBfICAgICAgICAgICAgIF9cclxuICAgIC8vICBfX198IHxfIF9fIF8gXyBfX3wgfF9cclxuICAgIC8vIC8gX198IF9fLyBfYCB8ICdfX3wgX198XHJcbiAgICAvLyBcXF9fIFxcIHx8IChffCB8IHwgIHwgfF9cclxuICAgIC8vIHxfX18vXFxfX1xcX18sX3xffCAgIFxcX198XHJcbiAgICAvL1xyXG5cclxuICAgIHN0YXJ0V2l0aENvb2tpZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBzZWxmLl9zZXRQYXJhbXNGcm9tQ29va2llKCk7XHJcbiAgICAgIHNlbGYuX2FwcGx5Q29va2llUGFyYW1zKCk7XHJcblxyXG4gICAgICBzZWxmLl9nZXRUb3RhbEl0ZW1zKGZ1bmN0aW9uICh0b3RhbEl0ZW1zKSB7XHJcbiAgICAgICAgc2VsZi5vcHRpb25zLnRvdGFsSXRlbXMgPSBwYXJzZUludCh0b3RhbEl0ZW1zKTtcclxuICAgICAgICBzZWxmLm9wdGlvbnMuJHRvdGFsSXRlbXMudGV4dCh0b3RhbEl0ZW1zKTtcclxuICAgICAgICBzZWxmLm9wdGlvbnMudG90YWxQYWdlcyA9IHNlbGYuX2dldFRvdGFsUGFnZXMoKTtcclxuXHJcbiAgICAgICAgc2VsZi5fY2hlY2tBbmRMb2FkV2l0aENvb2tpZSgpO1xyXG4gICAgICB9KVxyXG4gICAgfSxcclxuXHJcbiAgICBfY2hlY2tBbmRMb2FkV2l0aENvb2tpZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICB2YXIgcGFnZU51bWJlciA9IHNlbGYucmVxdWVzdC5xdWVyeS5QYWdlTnVtYmVyO1xyXG4gICAgICB2YXIgdG90YWxQYWdlcyA9IHNlbGYub3B0aW9ucy50b3RhbFBhZ2VzO1xyXG5cclxuICAgICAgc2VsZi5vcHRpb25zLiRyZXN1bHQudHJpZ2dlcigndnRleHNlYXJjaC5pbml0V2l0aENvb2tpZScsIFsgc2VsZi5vcHRpb25zLCBzZWxmLnJlcXVlc3QgXSk7XHJcblxyXG4gICAgICBpZiAoc2VsZi5vcHRpb25zLnBhZ2luYXRpb24pIHtcclxuICAgICAgICBzZWxmLl9zdGFydFBhZ2luYXRpb24oKTtcclxuICAgICAgICBzZWxmLmxvYWQoJ2h0bWwnLCBwYWdlTnVtYmVyLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBzZWxmLl9zaG93SXRlbXMocGFnZU51bWJlcik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHBhZ2VOdW1iZXIgPT09IHRvdGFsUGFnZXMgJiYgcGFnZU51bWJlciAhPT0gMSkge1xyXG4gICAgICAgIHNlbGYuX3Nob3dCdXR0b24oc2VsZi5vcHRpb25zLmNsYXNzTG9hZExlc3MpO1xyXG4gICAgICAgIHNlbGYuX2hpZGVCdXR0b24oc2VsZi5vcHRpb25zLmNsYXNzTG9hZE1vcmUpO1xyXG5cclxuICAgICAgICBzZWxmLmxvYWQoJ2h0bWwnLCBwYWdlTnVtYmVyLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBzZWxmLl9zaG93SXRlbXMocGFnZU51bWJlcik7XHJcblxyXG4gICAgICAgICAgc2VsZi5sb2FkKCdwcmVwZW5kJywgcGFnZU51bWJlciAtIDEpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgfSBlbHNlIGlmIChwYWdlTnVtYmVyID09PSAxKSB7XHJcbiAgICAgICAgc2VsZi5fc3RhcnRGaXJzdChwYWdlTnVtYmVyLCB0b3RhbFBhZ2VzID09PSAxID8gZmFsc2UgOiB0cnVlKTtcclxuXHJcbiAgICAgIH0gZWxzZSBpZiAocGFnZU51bWJlciA+IDEpIHtcclxuICAgICAgICBzZWxmLl9zaG93QnV0dG9uKHNlbGYub3B0aW9ucy5jbGFzc0xvYWRNb3JlKTtcclxuICAgICAgICBzZWxmLl9zaG93QnV0dG9uKHNlbGYub3B0aW9ucy5jbGFzc0xvYWRMZXNzKTtcclxuXHJcbiAgICAgICAgc2VsZi5sb2FkKCdodG1sJywgcGFnZU51bWJlciwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgc2VsZi5fc2V0VXJsSGFzaChwYWdlTnVtYmVyKTtcclxuICAgICAgICAgIHNlbGYuX3Nob3dJdGVtcyhwYWdlTnVtYmVyKTtcclxuXHJcbiAgICAgICAgICBzZWxmLmxvYWQoJ2FwcGVuZCcsIHBhZ2VOdW1iZXIgKyAxLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHNlbGYubG9hZCgncHJlcGVuZCcsIHBhZ2VOdW1iZXIgLSAxLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgc2VsZi5yZXF1ZXN0LnF1ZXJ5LlBhZ2VOdW1iZXIgPSBwYWdlTnVtYmVyO1xyXG4gICAgICAgICAgICAgIHNlbGYuX2NvbmNhdFJlcXVlc3QoKTtcclxuICAgICAgICAgICAgICBzZWxmLl9zYXZlQ29va2llKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX3N0YXJ0Rmlyc3Q6IGZ1bmN0aW9uIChwYWdlTnVtYmVyLCBzdGFydFNlY29uZCwgY2FsbGJhY2spIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgaWYgKHR5cGVvZiBzdGFydFNlY29uZCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBzdGFydFNlY29uZCA9IHRydWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChzZWxmLm9wdGlvbnMucGFnaW5hdGlvbiA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHN0YXJ0U2Vjb25kID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNlbGYuX2hpZGVCdXR0b24oc2VsZi5vcHRpb25zLmNsYXNzTG9hZExlc3MpO1xyXG5cclxuICAgICAgc2VsZi5sb2FkKCdodG1sJywgcGFnZU51bWJlciwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHNlbGYuX3Nob3dJdGVtcyhwYWdlTnVtYmVyKTtcclxuICAgICAgICBzZWxmLl9zYXZlQ29va2llKCk7XHJcblxyXG4gICAgICAgIGlmIChzdGFydFNlY29uZCkge1xyXG4gICAgICAgICAgc2VsZi5sb2FkKCdhcHBlbmQnLCBwYWdlTnVtYmVyICsgMSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBzZWxmLl9zaG93QnV0dG9uKHNlbGYub3B0aW9ucy5jbGFzc0xvYWRNb3JlKTtcclxuXHJcbiAgICAgICAgICAgIHR5cGVvZiBjYWxsYmFjayAhPT0gJ3VuZGVmaW5lZCcgJiYgY2FsbGJhY2soKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgc2VsZi5faGlkZUJ1dHRvbihzZWxmLm9wdGlvbnMuY2xhc3NMb2FkTW9yZSk7XHJcblxyXG4gICAgICAgICAgdHlwZW9mIGNhbGxiYWNrICE9PSAndW5kZWZpbmVkJyAmJiBjYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHN0YXJ0V2l0aG91dENvb2tpZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBzZWxmLm9wdGlvbnMuJHJlc3VsdC5maW5kKCc+IGRpdiA+IHVsID4gbGknKVxyXG4gICAgICAgIC5hdHRyKCdwYWdlJywgMSlcclxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2xhc3QgZmlyc3QnKTtcclxuXHJcbiAgICAgIC8vIHNlbGYuX3NldFVybEhhc2goMSk7XHJcbiAgICAgIHNlbGYuX3NhdmVDb29raWUoKTtcclxuXHJcbiAgICAgIGlmIChzZWxmLl9jaGVja0RlZmF1bHRQYXJhbXMoKSkge1xyXG4gICAgICAgIHNlbGYuX3NldERlZmF1bHRQYXJhbXMoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHNlbGYub3B0aW9ucy5wYWdpbmF0aW9uKSB7XHJcbiAgICAgICAgc2VsZi5fc3RhcnRQYWdpbmF0aW9uKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChzZWxmLm9wdGlvbnMudG90YWxQYWdlcyA9PT0gMSkge1xyXG4gICAgICAgIHNlbGYuX2hpZGVCdXR0b24oc2VsZi5vcHRpb25zLmNsYXNzTG9hZE1vcmUpO1xyXG4gICAgICAgIHNlbGYuX2Rpc2FibGVCdXR0b24oc2VsZi5vcHRpb25zLmNsYXNzTG9hZE1vcmUpO1xyXG5cclxuICAgICAgICBpZiAoc2VsZi5fY2hlY2tEZWZhdWx0UGFyYW1zKCkgfHwgc2VsZi5vcHRpb25zLmNoZWNrSGFzRGVmYXVsdFBhcmFtcykge1xyXG4gICAgICAgICAgc2VsZi5fc3RhcnRGaXJzdCgxLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChzZWxmLl9jaGVja0RlZmF1bHRQYXJhbXMoKSB8fCBzZWxmLm9wdGlvbnMuY2hlY2tIYXNEZWZhdWx0UGFyYW1zKSB7XHJcbiAgICAgICAgICBzZWxmLl9zdGFydEZpcnN0KDEsIHRydWUpO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgc2VsZi5sb2FkKCdhcHBlbmQnLCAyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX3N0YXJ0UGFnaW5hdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBzZWxmLl9oaWRlQnV0dG9uKHNlbGYub3B0aW9ucy5jbGFzc0xvYWRNb3JlKTtcclxuICAgICAgc2VsZi5fZGlzYWJsZUJ1dHRvbihzZWxmLm9wdGlvbnMuY2xhc3NMb2FkTW9yZSk7XHJcblxyXG4gICAgICBzZWxmLl9oaWRlQnV0dG9uKHNlbGYub3B0aW9ucy5jbGFzc0xvYWRMZXNzKTtcclxuICAgICAgc2VsZi5fZGlzYWJsZUJ1dHRvbihzZWxmLm9wdGlvbnMuY2xhc3NMb2FkTGVzcyk7XHJcblxyXG4gICAgICBzZWxmLl9jcmVhdGVQYWdpbmF0aW9uKCk7XHJcbiAgICAgIHNlbGYuYmluZFBhZ2luYXRpb24oKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2NsZWFyUGFnaW5hdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBzZWxmLm9wdGlvbnMuJHBhZ2luYXRpb24uaHRtbCgnJyk7XHJcbiAgICB9LFxyXG5cclxuXHJcbiAgICAvLyAgXyAgICAgICAgICAgICAgICAgX1xyXG4gICAgLy8gfCB8IF9fXyAgIF9fIF8gIF9ffCB8XHJcbiAgICAvLyB8IHwvIF8gXFwgLyBfYCB8LyBfYCB8XHJcbiAgICAvLyB8IHwgKF8pIHwgKF98IHwgKF98IHxcclxuICAgIC8vIHxffFxcX19fLyBcXF9fLF98XFxfXyxffFxyXG4gICAgLy9cclxuXHJcbiAgICBsb2FkOiBmdW5jdGlvbiAobWV0aG9kLCBwYWdlLCBjYWxsYmFjaykge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBzZWxmLnJlcXVlc3QucXVlcnkuUGFnZU51bWJlciA9IHBhZ2U7XHJcbiAgICAgIHNlbGYuX2NvbmNhdFJlcXVlc3QoKTtcclxuXHJcbiAgICAgIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyA/XHJcbiAgICAgICAgc2VsZi5fc2VhcmNoKG1ldGhvZCwgY2FsbGJhY2spIDogc2VsZi5fc2VhcmNoKG1ldGhvZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9zZWFyY2g6IGZ1bmN0aW9uIChtZXRob2QsIGNhbGxiYWNrLCBhdHRlbXB0cykge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBzZWxmLm9wdGlvbnMuJHJlc3VsdC50cmlnZ2VyKCd2dGV4c2VhcmNoLmJlZm9yZVNlYXJjaCcsIFsgc2VsZi5vcHRpb25zLCBzZWxmLnJlcXVlc3QgXSk7XHJcblxyXG4gICAgICBpZiAodHlwZW9mIGF0dGVtcHRzID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIGF0dGVtcHRzID0gMDtcclxuICAgICAgfVxyXG5cclxuICAgICAgJC5hamF4KHtcclxuICAgICAgICB1cmw6IHNlbGYucmVxdWVzdC51cmwsXHJcbiAgICAgICAgdHlwZTogJ0dFVCdcclxuICAgICAgfSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICB2YXIgJGxpc3QgPSBzZWxmLm9wdGlvbnMuJHJlc3VsdC5maW5kKCc+IGRpdiA+IHVsJyk7XHJcbiAgICAgICAgdmFyICRwcm9kdWN0cyA9ICQocmVzcG9uc2UpLmZpbmQoJ3VsJyk7XHJcblxyXG4gICAgICAgICRwcm9kdWN0cy5maW5kKCcubGFzdCwgLmZpcnN0JykucmVtb3ZlQ2xhc3MoJ2xhc3QgZmlyc3QnKTtcclxuICAgICAgICAkcHJvZHVjdHMuZmluZCgnLmhlbHBlckNvbXBsZW1lbnQnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgdmFyICRpdGVtID0gJHByb2R1Y3RzLmZpbmQoJ2xpJyk7XHJcbiAgICAgICAgJGl0ZW0uYXR0cigncGFnZScsIHNlbGYucmVxdWVzdC5xdWVyeS5QYWdlTnVtYmVyKTtcclxuICAgICAgICAkaXRlbS5hZGRDbGFzcyhzZWxmLm9wdGlvbnMuY2xhc3NJdGVtUHJlTG9hZCk7XHJcblxyXG4gICAgICAgIHZhciBwcm9kdWN0c0NvbnRlbnQgPSAkcHJvZHVjdHMuaHRtbCgpIHx8ICcnO1xyXG4gICAgICAgICRsaXN0W21ldGhvZF0ocHJvZHVjdHNDb250ZW50KTtcclxuXHJcbiAgICAgICAgaWYgKHNlbGYub3B0aW9ucy4kcmVzdWx0LmlzKCc6aGlkZGVuJykpIHtcclxuICAgICAgICAgIHNlbGYub3B0aW9ucy4kcmVzdWx0LnNob3coKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGYub3B0aW9ucy4kcmVzdWx0LnRyaWdnZXIoJ3Z0ZXhzZWFyY2guYWZ0ZXJTZWFyY2gnLCBbIHNlbGYub3B0aW9ucywgc2VsZi5yZXF1ZXN0IF0pO1xyXG5cclxuICAgICAgICBhdHRlbXB0cyA9IDA7XHJcblxyXG4gICAgICAgIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyAmJiBjYWxsYmFjayhzZWxmKTtcclxuXHJcbiAgICAgIH0sIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDUwMCAmJiBhdHRlbXB0cyA8IHNlbGYub3B0aW9ucy5hdHRlbXB0cykge1xyXG4gICAgICAgICAgYXR0ZW1wdHMrKztcclxuICAgICAgICAgIHNlbGYuX3NlYXJjaChtZXRob2QsIGNhbGxiYWNrLCBhdHRlbXB0cyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIG9uIGdldCBwYWdlJywgcmVzcG9uc2UpO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8vICBfICAgICAgICAgIF9cclxuICAgIC8vIHwgfF9fICAgX19ffCB8XyBfXyAgIF9fXyBfIF9fIF9fX1xyXG4gICAgLy8gfCAnXyBcXCAvIF8gXFwgfCAnXyBcXCAvIF8gXFwgJ19fLyBfX3xcclxuICAgIC8vIHwgfCB8IHwgIF9fLyB8IHxfKSB8ICBfXy8gfCAgXFxfXyBcXFxyXG4gICAgLy8gfF98IHxffFxcX19ffF98IC5fXy8gXFxfX198X3wgIHxfX18vXHJcbiAgICAvLyAgICAgICAgICAgICAgfF98XHJcblxyXG4gICAgX3NldFBhcmFtc0Zyb21Db29raWU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgdmFyIGNvb2tpZSA9IENvb2tpZXMuZ2V0KHNlbGYub3B0aW9ucy5jb29raWVOYW1lKTtcclxuXHJcbiAgICAgIHNlbGYucmVxdWVzdCA9IEpTT04ucGFyc2UoY29va2llKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2FwcGx5Q29va2llUGFyYW1zOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgIHNlbGYuX3NldE9yZGVyKCk7XHJcbiAgICAgIHNlbGYuX3NldEZpbHRlcnMoKTtcclxuICAgIH0sXHJcblxyXG4gICAgX3NldE9yZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgIHNlbGYub3B0aW9ucy4kc2VsZWN0T3JkZXIudmFsKHNlbGYucmVxdWVzdC5PKTtcclxuICAgIH0sXHJcblxyXG4gICAgX3NldEZpbHRlcnM6IGZ1bmN0aW9uIChmcSkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICB2YXIgZnEgPSBzZWxmLnJlcXVlc3QucXVlcnkuZnE7XHJcblxyXG4gICAgICBmb3IgKHZhciBmaWx0ZXIgaW4gZnEpIHtcclxuICAgICAgICB2YXIgdmFsdWUgPSBmcVtmaWx0ZXJdO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciAkY2hlY2tib3ggPSBzZWxmLm9wdGlvbnMuJGZpbHRlcnMuZmluZCgnaW5wdXRbcmVsPVwiZnE9JysgdmFsdWUgKydcIl0nKTtcclxuXHJcbiAgICAgICAgaWYgKCRjaGVja2JveC5sZW5ndGgpIHtcclxuICAgICAgICAgICRjaGVja2JveFxyXG4gICAgICAgICAgICAuYXR0cignY2hlY2tlZCcsICdjaGVja2VkJylcclxuICAgICAgICAgICAgLnBhcmVudCgpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcyhzZWxmLm9wdGlvbnMuY2xhc3NGaWx0ZXJBY3RpdmUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfY2hlY2tEZWZhdWx0UGFyYW1zOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgIHJldHVybiAhIU9iamVjdC5rZXlzKHNlbGYub3B0aW9ucy5kZWZhdWx0UGFyYW1zKS5sZW5ndGg7XHJcbiAgICB9LFxyXG5cclxuICAgIF9zZXREZWZhdWx0UGFyYW1zOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgIGlmIChzZWxmLnJlcXVlc3QucXVlcnkuaGFzT3duUHJvcGVydHkoJ08nKSkge1xyXG4gICAgICAgIGRlbGV0ZSBzZWxmLm9wdGlvbnMuZGVmYXVsdFBhcmFtcy5xdWVyeS5PXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNlbGYucmVxdWVzdCA9ICQuZXh0ZW5kKHRydWUsIHNlbGYucmVxdWVzdCwgc2VsZi5vcHRpb25zLmRlZmF1bHRQYXJhbXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfc2V0VXJsSGFzaDogZnVuY3Rpb24gKHBhZ2UpIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgdmFyIHBhZ2VOdW1iZXIgPSB0eXBlb2YgcGFnZSAhPT0gJ3VuZGVmaW5lZCcgPyBwYWdlIDogc2VsZi5yZXF1ZXN0LnF1ZXJ5LlBhZ2VOdW1iZXI7XHJcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gcGFnZU51bWJlcjtcclxuICAgIH0sXHJcblxyXG4gICAgX3Nob3dJdGVtczogZnVuY3Rpb24gKHBhZ2UpIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgc2VsZi5vcHRpb25zLiRyZXN1bHQudHJpZ2dlcigndnRleHNlYXJjaC5iZWZvcmVTaG93SXRlbXMnLCBbIHNlbGYub3B0aW9ucywgc2VsZi5yZXF1ZXN0LCBwYWdlIF0pO1xyXG5cclxuICAgICAgc2VsZi5vcHRpb25zLiRyZXN1bHRcclxuICAgICAgICAuZmluZCgnLicrIHNlbGYub3B0aW9ucy5jbGFzc0l0ZW1QcmVMb2FkICsnW3BhZ2U9XCInKyBwYWdlICsnXCJdJylcclxuICAgICAgICAucmVtb3ZlQ2xhc3Moc2VsZi5vcHRpb25zLmNsYXNzSXRlbVByZUxvYWQpO1xyXG5cclxuICAgICAgc2VsZi5vcHRpb25zLiRyZXN1bHQudHJpZ2dlcigndnRleHNlYXJjaC5hZnRlclNob3dJdGVtcycsIFsgc2VsZi5vcHRpb25zLCBzZWxmLnJlcXVlc3QsIHBhZ2UgXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9lbmFibGVCdXR0b246IGZ1bmN0aW9uIChidXR0b24pIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgJCgnLicrIGJ1dHRvbikucmVtb3ZlQXR0cignZGlzYWJsZWQnKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2Rpc2FibGVCdXR0b246IGZ1bmN0aW9uIChidXR0b24pIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgJCgnLicrIGJ1dHRvbikuYXR0cignZGlzYWJsZWQnLCAnZGlzYWJsZWQnKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2hpZGVCdXR0b246IGZ1bmN0aW9uIChidXR0b24pIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgJCgnLicrIGJ1dHRvbikuYWRkQ2xhc3Moc2VsZi5vcHRpb25zLmNsYXNzTG9hZEJ0bkhpZGUpXHJcbiAgICB9LFxyXG5cclxuICAgIF9zaG93QnV0dG9uOiBmdW5jdGlvbiAoYnV0dG9uKSB7XHJcbiAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICQoJy4nKyBidXR0b24pLnJlbW92ZUNsYXNzKHNlbGYub3B0aW9ucy5jbGFzc0xvYWRCdG5IaWRlKVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIF9nZXRQYWdlQnlUeXBlXHJcbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGUgJ25leHQnIG9yICdwcmV2J1xyXG4gICAgICogQHJldHVybiB7b2JqZWN0fSAgICAgIHNob3dQYWdlIGFuZCBuZXh0UGFnZVxyXG4gICAgICovXHJcbiAgICBfZ2V0UGFnZUJ5VHlwZTogZnVuY3Rpb24gKHR5cGUpIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgdmFyICRpdGVtcyA9IHNlbGYub3B0aW9ucy4kcmVzdWx0LmZpbmQoJz4gZGl2ID4gdWwgPiBsaScpO1xyXG5cclxuICAgICAgdmFyIG1ldGhvZCA9ICdsYXN0JztcclxuICAgICAgdmFyIG9wZXJhdGlvbiA9ICcrJztcclxuXHJcbiAgICAgIGlmICh0eXBlID09PSAncHJldicpIHtcclxuICAgICAgICBtZXRob2QgPSAnZmlyc3QnO1xyXG4gICAgICAgIG9wZXJhdGlvbiA9ICctJztcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHBhZ2UgPSBOdW1iZXIoJGl0ZW1zW21ldGhvZF0oKS5hdHRyKCdwYWdlJykpO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzaG93UGFnZTogcGFnZSxcclxuICAgICAgICBuZXh0UGFnZTogZXZhbChwYWdlICsgb3BlcmF0aW9uICsgMSlcclxuICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgX2NvbmNhdFJlcXVlc3Q6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgdmFyIHF1ZXJ5ID0gc2VsZi5yZXF1ZXN0LnF1ZXJ5O1xyXG4gICAgICB2YXIgdXJsID0gc2VsZi5yZXF1ZXN0LnJvdXRlICsnPyc7XHJcblxyXG4gICAgICB2YXIgbGVuID0gT2JqZWN0LmtleXMocXVlcnkpLmxlbmd0aCAtIDE7XHJcbiAgICAgIHZhciBpbmRleCA9IDA7XHJcblxyXG4gICAgICBmb3IgKHZhciBpdGVtIGluIHF1ZXJ5KSB7XHJcbiAgICAgICAgaWYgKGl0ZW0gPT09ICdmcScpIHtcclxuICAgICAgICAgIHZhciBmcVJlc3VsdCA9IHNlbGYuX2NvbmNhdFJlcXVlc3RGaWx0ZXIocXVlcnlbaXRlbV0sIGl0ZW0pO1xyXG4gICAgICAgICAgdXJsID0gdXJsLmNvbmNhdChmcVJlc3VsdCk7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB1cmwgPSB1cmwuY29uY2F0KGl0ZW0sICc9JywgcXVlcnlbaXRlbV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSBsZW4pIHtcclxuICAgICAgICAgIHVybCA9IHVybC5jb25jYXQoJyYnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluZGV4Kys7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNlbGYucmVxdWVzdC51cmwgPSB1cmw7XHJcbiAgICB9LFxyXG5cclxuICAgIF9jb25jYXRSZXF1ZXN0RmlsdGVyOiBmdW5jdGlvbiAoYXJyYXksIGl0ZW0pIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgdmFyIHVybCA9ICcnO1xyXG5cclxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdXJsID0gdXJsLmNvbmNhdChpdGVtLCAnPScsIGFycmF5W2ldKTtcclxuXHJcbiAgICAgICAgaWYgKGkgIT09IGxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgIHVybCA9IHVybC5jb25jYXQoJyYnKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB1cmw7XHJcbiAgICB9LFxyXG5cclxuICAgIF9zYXZlQ29va2llOiBmdW5jdGlvbiAocmVxdWVzdCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBpZiAodHlwZW9mIHJlcXVlc3QgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgcmVxdWVzdCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc2VsZi5yZXF1ZXN0KSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciByZXF1ZXN0U3RyaW5naWZ5ID0gSlNPTi5zdHJpbmdpZnkocmVxdWVzdCk7XHJcblxyXG4gICAgICBDb29raWVzLnNldChzZWxmLm9wdGlvbnMuY29va2llTmFtZSwgcmVxdWVzdFN0cmluZ2lmeSk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9sb2FkTmV4dDogZnVuY3Rpb24gKHBhZ2VCeVR5cGUpIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgaWYgKHBhZ2VCeVR5cGUubmV4dFBhZ2UgPCAxIHx8IHBhZ2VCeVR5cGUubmV4dFBhZ2UgPiBzZWxmLm9wdGlvbnMudG90YWxQYWdlcykge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIF9zZXRQYWdpbmF0aW9uSW5mbzogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBzZWxmLm9wdGlvbnMudG90YWxJdGVtcyA9IHNlbGYuX2dldFRvdGFsSXRlbXMoKTtcclxuICAgICAgc2VsZi5vcHRpb25zLnRvdGFsUGFnZXMgPSBzZWxmLl9nZXRUb3RhbFBhZ2VzKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9sb2FkRmlyc3Q6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBzZWxmLl9nZXRUb3RhbEl0ZW1zKGZ1bmN0aW9uICh0b3RhbEl0ZW1zKSB7XHJcbiAgICAgICAgc2VsZi5vcHRpb25zLnRvdGFsSXRlbXMgPSBwYXJzZUludCh0b3RhbEl0ZW1zKTtcclxuICAgICAgICBzZWxmLm9wdGlvbnMuJHRvdGFsSXRlbXMudGV4dCh0b3RhbEl0ZW1zKTtcclxuICAgICAgICBzZWxmLm9wdGlvbnMudG90YWxQYWdlcyA9IHNlbGYuX2dldFRvdGFsUGFnZXMoKTtcclxuXHJcbiAgICAgICAgc2VsZi5fc3RhcnRGaXJzdCgxLCBzZWxmLm9wdGlvbnMudG90YWxQYWdlcyA8IDIgPyBmYWxzZSA6IHRydWUsIGNhbGxiYWNrKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRvdGFsIGl0ZW1zXHJcbiAgICAgKiBAcGFyYW0gIHtmdW5jdGlvbn0gY2FsbGJhY2sgSWYgaGF2ZSBjYWxsYmFjayBtZWFucyB0aGF0IGl0IHdpbGwgcGljayB1cCBmcm9tIEFQSSwgZWxzZSBwaWNrIHVwIGZyb20gZWxlbWVudCBpbiBwYWdlXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIF9nZXRUb3RhbEl0ZW1zOiBmdW5jdGlvbiAoY2FsbGJhY2ssIGF0dGVtcHRzKSB7XHJcbiAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBHZXQgdG90YWwgaXRlbXMgZnJvbSBBUElcclxuICAgICAgICovXHJcbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGF0dGVtcHRzID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgYXR0ZW1wdHMgPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VsZi5fY29uY2F0UmVxdWVzdCgpO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdFVybCA9IHNlbGYucmVxdWVzdC51cmwucmVwbGFjZSgnL2J1c2NhcGFnaW5hJywgJycpO1xyXG4gICAgICAgIHZhciB1cmwgPSAnL2FwaS9jYXRhbG9nX3N5c3RlbS9wdWIvcHJvZHVjdHMvc2VhcmNoJysgcmVxdWVzdFVybCArJyZfZnJvbT0wJl90bz0xJztcclxuXHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgdHlwZTogJ2dldCdcclxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSwgdGV4dFN0YXR1cywgcmVxdWVzdCkge1xyXG4gICAgICAgICAgdmFyIHJlc291cmNlcyA9IHJlcXVlc3QuZ2V0UmVzcG9uc2VIZWFkZXIoJ3Jlc291cmNlcycpO1xyXG4gICAgICAgICAgdmFyIHRvdGFsSXRlbXMgPSBwYXJzZUludChyZXNvdXJjZXMuc3BsaXQoJy8nKVsxXSk7XHJcblxyXG4gICAgICAgICAgYXR0ZW1wdHMgPSAwO1xyXG5cclxuICAgICAgICAgIHJldHVybiBjYWxsYmFjayh0b3RhbEl0ZW1zKTtcclxuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDUwMCAmJiBhdHRlbXB0cyA8IHNlbGYub3B0aW9ucy5hdHRlbXB0cykge1xyXG4gICAgICAgICAgICBhdHRlbXB0cysrO1xyXG4gICAgICAgICAgICBzZWxmLl9nZXRUb3RhbEl0ZW1zKGNhbGxiYWNrLCBhdHRlbXB0cyk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciBvbiBnZXQgdG90YWwgaXRlbXMnLCByZXNwb25zZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEdldCB0b3RhbCBpdGVtcyBmcm9tIGVsZW1lbnRcclxuICAgICAgICovXHJcbiAgICAgIHZhciByZXN1bHQgPSBzZWxmLm9wdGlvbnMuJHRvdGFsSXRlbXMudGV4dCgpO1xyXG4gICAgICB2YXIgcGF0dGVybiA9IC9cXEQvZztcclxuICAgICAgdmFyIHRvdGFsID0gcmVzdWx0LnJlcGxhY2UocGF0dGVybiwgJycpO1xyXG5cclxuICAgICAgcmV0dXJuIHBhcnNlSW50KE1hdGguY2VpbCh0b3RhbCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0VG90YWxQYWdlczogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICB2YXIgcHMgPSBzZWxmLnJlcXVlc3QucXVlcnkuUFM7XHJcbiAgICAgIHZhciB0b3RhbEl0ZW1zID0gc2VsZi5vcHRpb25zLnRvdGFsSXRlbXM7XHJcblxyXG4gICAgICB2YXIgdG90YWxQYWdlcyA9IE1hdGguY2VpbCh0b3RhbEl0ZW1zIC8gcHMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRvdGFsUGFnZXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUGFnaW5hdGlvblxyXG4gICAgICovXHJcbiAgICBfY3JlYXRlUGFnaW5hdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBzZWxmLm9wdGlvbnMuJHBhZ2luYXRpb24gPSAkKCcuJysgc2VsZi5vcHRpb25zLmNsYXNzUGFnaW5hdGlvbik7XHJcblxyXG4gICAgICBzZWxmLl9jcmVhdGVQYWdpbmF0aW9uRmlyc3RCdXR0b24oKTtcclxuICAgICAgc2VsZi5fY3JlYXRlUGFnaW5hdGlvblByZXZCdXR0b24oKTtcclxuICAgICAgc2VsZi5fY3JlYXRlUGFnaW5hdGlvbkJ1dHRvbnMoKTtcclxuICAgICAgc2VsZi5fY3JlYXRlUGFnaW5hdGlvbk5leHRCdXR0b24oKTtcclxuICAgICAgc2VsZi5fY3JlYXRlUGFnaW5hdGlvbkxhc3RCdXR0b24oKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2NyZWF0ZVBhZ2luYXRpb25GaXJzdEJ1dHRvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICB2YXIgJGZpcnN0ID0gJCgnPGJ1dHRvbiAvPicsIHtcclxuICAgICAgICBjbGFzczogJ3BhZ2luYXRpb25fX2J1dHRvbiBwYWdpbmF0aW9uX19idXR0b24tLWZpcnN0JyxcclxuICAgICAgICBwYWdlOiAnMSdcclxuICAgICAgfSkudGV4dChzZWxmLm9wdGlvbnMudGV4dFBhZ2luYXRpb25GaXJzdCk7XHJcblxyXG4gICAgICBpZiAoc2VsZi5yZXF1ZXN0LnF1ZXJ5LlBhZ2VOdW1iZXIgPT09IDEpIHtcclxuICAgICAgICBzZWxmLl9kaXNhYmxlUGFnaW5hdGlvbkJ1dHRvbigkZmlyc3QpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzZWxmLm9wdGlvbnMuJHBhZ2luYXRpb24uYXBwZW5kKCRmaXJzdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9jcmVhdGVQYWdpbmF0aW9uUHJldkJ1dHRvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICB2YXIgJHByZXYgPSAkKCc8YnV0dG9uIC8+Jywge1xyXG4gICAgICAgIGNsYXNzOiAncGFnaW5hdGlvbl9fYnV0dG9uIHBhZ2luYXRpb25fX2J1dHRvbi0tcHJldicsXHJcbiAgICAgICAgcGFnZTogc2VsZi5yZXF1ZXN0LnF1ZXJ5LlBhZ2VOdW1iZXIgLSAxXHJcbiAgICAgIH0pLnRleHQoc2VsZi5vcHRpb25zLnRleHRQYWdpbmF0aW9uUHJldik7XHJcblxyXG4gICAgICBpZiAoc2VsZi5yZXF1ZXN0LnF1ZXJ5LlBhZ2VOdW1iZXIgPT09IDEpIHtcclxuICAgICAgICBzZWxmLl9kaXNhYmxlUGFnaW5hdGlvbkJ1dHRvbigkcHJldik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNlbGYub3B0aW9ucy4kcGFnaW5hdGlvbi5hcHBlbmQoJHByZXYpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfY3JlYXRlUGFnaW5hdGlvbkJ1dHRvbnM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgZm9yICh2YXIgaSA9IHNlbGYucmVxdWVzdC5xdWVyeS5QYWdlTnVtYmVyIC0gc2VsZi5vcHRpb25zLnBhZ2luYXRpb25SYW5nZUJ1dHRvbnM7IGkgPD0gc2VsZi5yZXF1ZXN0LnF1ZXJ5LlBhZ2VOdW1iZXI7IGkrKykge1xyXG4gICAgICAgIGlmIChpIDwgMSB8fCBpID09PSBzZWxmLnJlcXVlc3QucXVlcnkuUGFnZU51bWJlcikge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgJHBhZ2UgPSAkKCc8YnV0dG9uIC8+Jywge1xyXG4gICAgICAgICAgY2xhc3M6ICdwYWdpbmF0aW9uX19idXR0b24gcGFnaW5hdGlvbl9fYnV0dG9uLS1wYWdlJyxcclxuICAgICAgICAgIHBhZ2U6IGlcclxuICAgICAgICB9KS50ZXh0KGkpO1xyXG4gICAgICAgIHNlbGYub3B0aW9ucy4kcGFnaW5hdGlvbi5hcHBlbmQoJHBhZ2UpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgJHBhZ2UgPSAkKCc8YnV0dG9uIC8+Jywge1xyXG4gICAgICAgIGNsYXNzOiAncGFnaW5hdGlvbl9fYnV0dG9uIHBhZ2luYXRpb25fX2J1dHRvbi0tcGFnZSBwYWdpbmF0aW9uX19idXR0b24tLWRpc2FibGVkIHBhZ2luYXRpb25fX2J1dHRvbi0tY3VycmVudCcsXHJcbiAgICAgICAgcGFnZTogc2VsZi5yZXF1ZXN0LnF1ZXJ5LlBhZ2VOdW1iZXIsXHJcbiAgICAgICAgZGlzYWJsZWQ6ICdkaXNhYmxlZCdcclxuICAgICAgfSkudGV4dChzZWxmLnJlcXVlc3QucXVlcnkuUGFnZU51bWJlcik7XHJcbiAgICAgIHNlbGYub3B0aW9ucy4kcGFnaW5hdGlvbi5hcHBlbmQoJHBhZ2UpO1xyXG5cclxuICAgICAgZm9yICh2YXIgaSA9IHNlbGYucmVxdWVzdC5xdWVyeS5QYWdlTnVtYmVyICsgMTsgaSA8PSBzZWxmLnJlcXVlc3QucXVlcnkuUGFnZU51bWJlciArIHNlbGYub3B0aW9ucy5wYWdpbmF0aW9uUmFuZ2VCdXR0b25zOyBpKyspIHtcclxuICAgICAgICBpZiAoaSA+IHNlbGYuX2dldFRvdGFsUGFnZXMoKSkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgJHBhZ2UgPSAkKCc8YnV0dG9uIC8+Jywge1xyXG4gICAgICAgICAgY2xhc3M6ICdwYWdpbmF0aW9uX19idXR0b24gcGFnaW5hdGlvbl9fYnV0dG9uLS1wYWdlJyxcclxuICAgICAgICAgIHBhZ2U6IGlcclxuICAgICAgICB9KS50ZXh0KGkpO1xyXG4gICAgICAgIHNlbGYub3B0aW9ucy4kcGFnaW5hdGlvbi5hcHBlbmQoJHBhZ2UpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9jcmVhdGVQYWdpbmF0aW9uTmV4dEJ1dHRvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICB2YXIgJG5leHQgPSAkKCc8YnV0dG9uIC8+Jywge1xyXG4gICAgICAgIGNsYXNzOiAncGFnaW5hdGlvbl9fYnV0dG9uIHBhZ2luYXRpb25fX2J1dHRvbi0tbmV4dCcsXHJcbiAgICAgICAgcGFnZTogc2VsZi5yZXF1ZXN0LnF1ZXJ5LlBhZ2VOdW1iZXIgKyAxXHJcbiAgICAgIH0pLnRleHQoc2VsZi5vcHRpb25zLnRleHRQYWdpbmF0aW9uTmV4dCk7XHJcblxyXG4gICAgICBpZiAoc2VsZi5yZXF1ZXN0LnF1ZXJ5LlBhZ2VOdW1iZXIgPT09IHNlbGYuX2dldFRvdGFsUGFnZXMoKSkge1xyXG4gICAgICAgIHNlbGYuX2Rpc2FibGVQYWdpbmF0aW9uQnV0dG9uKCRuZXh0KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc2VsZi5vcHRpb25zLiRwYWdpbmF0aW9uLmFwcGVuZCgkbmV4dCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9jcmVhdGVQYWdpbmF0aW9uTGFzdEJ1dHRvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICB2YXIgJGxhc3QgPSAkKCc8YnV0dG9uIC8+Jywge1xyXG4gICAgICAgIGNsYXNzOiAncGFnaW5hdGlvbl9fYnV0dG9uIHBhZ2luYXRpb25fX2J1dHRvbi0tbGFzdCcsXHJcbiAgICAgICAgcGFnZTogc2VsZi5fZ2V0VG90YWxQYWdlcygpXHJcbiAgICAgIH0pLnRleHQoc2VsZi5vcHRpb25zLnRleHRQYWdpbmF0aW9uTGFzdCk7XHJcblxyXG4gICAgICBpZiAoc2VsZi5yZXF1ZXN0LnF1ZXJ5LlBhZ2VOdW1iZXIgPT09IHNlbGYuX2dldFRvdGFsUGFnZXMoKSkge1xyXG4gICAgICAgIHNlbGYuX2Rpc2FibGVQYWdpbmF0aW9uQnV0dG9uKCRsYXN0KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc2VsZi5vcHRpb25zLiRwYWdpbmF0aW9uLmFwcGVuZCgkbGFzdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9kaXNhYmxlUGFnaW5hdGlvbkJ1dHRvbjogZnVuY3Rpb24gKCRlbGVtZW50KSB7XHJcbiAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICRlbGVtZW50XHJcbiAgICAgICAgLmFkZENsYXNzKCdwYWdpbmF0aW9uX19idXR0b24tLWRpc2FibGVkJylcclxuICAgICAgICAuYXR0cignZGlzYWJsZWQnLCAnZGlzYWJsZWQnKTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXyAgICAgICAgICAgICAgICAgICAgIF8gICAgICAgXyAgICAgX1xyXG4gICAgLy8gIF8gX18gX19fICBfXyBfIF8gICBfICBfX18gIF9fX3wgfF8gIF9fICAgX19fXyBfIF8gX18oXykgX18gX3wgfF9fIHwgfCBfX19cclxuICAgIC8vIHwgJ19fLyBfIFxcLyBfYCB8IHwgfCB8LyBfIFxcLyBfX3wgX198IFxcIFxcIC8gLyBfYCB8ICdfX3wgfC8gX2AgfCAnXyBcXHwgfC8gXyBcXFxyXG4gICAgLy8gfCB8IHwgIF9fLyAoX3wgfCB8X3wgfCAgX18vXFxfXyBcXCB8XyAgIFxcIFYgLyAoX3wgfCB8ICB8IHwgKF98IHwgfF8pIHwgfCAgX18vXHJcbiAgICAvLyB8X3wgIFxcX19ffFxcX18sIHxcXF9fLF98XFxfX198fF9fXy9cXF9ffCAgIFxcXy8gXFxfXyxffF98ICB8X3xcXF9fLF98Xy5fXy98X3xcXF9fX3xcclxuICAgIC8vICAgICAgICAgICAgICB8X3xcclxuICAgIC8vXHJcblxyXG4gICAgX3NldFJlcXVlc3Q6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgdmFyIHJlcXVlc3RVcmwgPSBzZWxmLl9nZXRSZXF1ZXN0VXJsKCk7XHJcblxyXG4gICAgICByZXR1cm4gc2VsZi5fc3BsaXRSZXF1ZXN0VXJsKHJlcXVlc3RVcmwpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0UmVxdWVzdFVybDogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICB2YXIgc2NyaXB0Q29udGVudCA9IHNlbGYub3B0aW9ucy4kc2NyaXB0Lmh0bWwoKTtcclxuICAgICAgdmFyIHBhdHRlcm4gPSAvXFwvYnVzY2FwYWdpbmFcXD8uKyZQYWdlTnVtYmVyPS9naTtcclxuICAgICAgdmFyIHVybCA9IHBhdHRlcm4uZXhlYyhzY3JpcHRDb250ZW50KVswXTtcclxuXHJcbiAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQodXJsKTtcclxuICAgIH0sXHJcblxyXG4gICAgX3NwbGl0UmVxdWVzdFVybDogZnVuY3Rpb24gKHVybCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICB2YXIgc3BsaXRVcmwgPSB1cmwuc3BsaXQoJz8nKTtcclxuICAgICAgdmFyIHJvdXRlID0gc3BsaXRVcmxbMF07XHJcblxyXG4gICAgICBpZiAoc3BsaXRVcmwubGVuZ3RoID4gMSkge1xyXG4gICAgICAgIHZhciBsb2NhdGlvbiA9IHdpbmRvdy5sb2NhdGlvbjtcclxuICAgICAgICB2YXIgc2VhcmNoID0gbG9jYXRpb24uc2VhcmNoO1xyXG4gICAgICAgIHZhciBxdWVyeVN0cmluZ1ZURVggPSBzcGxpdFVybFsxXTtcclxuICAgICAgICB2YXIgcXVlcnlTdHJpbmdCcm93c2VyID0gc2VhcmNoLnN1YnN0cigxKTtcclxuICAgICAgICB2YXIgc3BsaXRIYXNoID0gcXVlcnlTdHJpbmdWVEVYLnNwbGl0KCcjJyk7XHJcblxyXG4gICAgICAgIHZhciBxdWVyeSA9IHNwbGl0SGFzaFswXTtcclxuICAgICAgICB2YXIgaGFzaCA9IHNwbGl0SGFzaFsxXTtcclxuXHJcbiAgICAgICAgc2VsZi5vcHRpb25zLnF1ZXJ5T2JqZWN0ID0ge307XHJcbiAgICAgICAgc2VsZi5vcHRpb25zLnF1ZXJ5T2JqZWN0WydmcSddID0gW107XHJcblxyXG4gICAgICAgIHZhciBwYXR0ZXJuID0gbmV3IFJlZ0V4cCgnKFtePSZdKyk9KFteJl0qKScsICdnJyk7XHJcblxyXG4gICAgICAgIHF1ZXJ5LnJlcGxhY2UocGF0dGVybiwgZnVuY3Rpb24obSwga2V5LCB2YWx1ZSl7XHJcbiAgICAgICAgICBzZWxmLl9idWlsZFF1ZXJ5U3RyaW5nVlRFWFBhcmFtcyhtLCBrZXksIHZhbHVlLCBzZWxmKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHF1ZXJ5U3RyaW5nQnJvd3Nlci5yZXBsYWNlKHBhdHRlcm4sIGZ1bmN0aW9uKG0sIGtleSwgdmFsdWUpe1xyXG4gICAgICAgICAgc2VsZi5fY2hlY2tBbmRJbnNlcnRRdWVyeVN0cmluZ0Jyb3dzZXJQYXJhbXMobSwga2V5LCB2YWx1ZSwgc2VsZilcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuICh7XHJcbiAgICAgICAgICByb3V0ZTogcm91dGUsXHJcbiAgICAgICAgICBxdWVyeTogc2VsZi5vcHRpb25zLnF1ZXJ5T2JqZWN0LFxyXG4gICAgICAgICAgaGFzaDogaGFzaCxcclxuICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgcGF0aDogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgd2luZG93LmxvY2F0aW9uLnNlYXJjaFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKHtcclxuICAgICAgICByb3V0ZTogcm91dGUsXHJcbiAgICAgICAgdXJsOiB1cmxcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9idWlsZFF1ZXJ5U3RyaW5nVlRFWFBhcmFtczogZnVuY3Rpb24gKG0sIGtleSwgdmFsdWUsIHNlbGYpIHtcclxuICAgICAgdmFyIHVybFZhbHVlID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcclxuICAgICAgdmFyIHVybEtleSA9IGRlY29kZVVSSUNvbXBvbmVudChrZXkpXHJcblxyXG4gICAgICBpZiAodXJsS2V5ID09PSAnZnEnKSB7XHJcbiAgICAgICAgc2VsZi5vcHRpb25zLnF1ZXJ5T2JqZWN0W3VybEtleV0ucHVzaCh1cmxWYWx1ZSk7XHJcblxyXG4gICAgICB9IGVsc2UgaWYgKHVybEtleSA9PT0gJ1BhZ2VOdW1iZXInICYmIHZhbHVlID09PSAnJykge1xyXG4gICAgICAgIHNlbGYub3B0aW9ucy5xdWVyeU9iamVjdFt1cmxLZXldID0gMTtcclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2VsZi5vcHRpb25zLnF1ZXJ5T2JqZWN0W3VybEtleV0gPSB1cmxWYWx1ZTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfY2hlY2tBbmRJbnNlcnRRdWVyeVN0cmluZ0Jyb3dzZXJQYXJhbXM6IGZ1bmN0aW9uIChtLCBrZXksIHZhbHVlLCBzZWxmKSB7XHJcbiAgICAgIHZhciB1cmxWYWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XHJcbiAgICAgIHZhciB1cmxLZXkgPSBkZWNvZGVVUklDb21wb25lbnQoa2V5KVxyXG5cclxuICAgICAgaWYgKHVybEtleSA9PSAnTycpIHtcclxuICAgICAgICBzZWxmLm9wdGlvbnMucXVlcnlPYmplY3RbdXJsS2V5XSA9IHVybFZhbHVlO1xyXG4gICAgICAgIHNlbGYub3B0aW9ucy5jaGVja0hhc0RlZmF1bHRQYXJhbXMgPSB0cnVlXHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG5cclxuICAgIC8vICBfICAgICBfICAgICAgICAgICBfXHJcbiAgICAvLyB8IHxfXyAoXylfIF9fICAgX198IHxcclxuICAgIC8vIHwgJ18gXFx8IHwgJ18gXFwgLyBfYCB8XHJcbiAgICAvLyB8IHxfKSB8IHwgfCB8IHwgKF98IHxcclxuICAgIC8vIHxfLl9fL3xffF98IHxffFxcX18sX3xcclxuICAgIC8vXHJcblxyXG4gICAgYmluZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBzZWxmLmJpbmRMb2FkTW9yZUFuZExlc3MoKTtcclxuICAgICAgc2VsZi5iaW5kT3JkZXIoKTtcclxuICAgICAgc2VsZi5iaW5kRmlsdGVycygpO1xyXG4gICAgfSxcclxuXHJcbiAgICBiaW5kTG9hZE1vcmVBbmRMZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICQoJy4nKyBzZWxmLm9wdGlvbnMuY2xhc3NMb2FkTGVzcyArJywgLicrIHNlbGYub3B0aW9ucy5jbGFzc0xvYWRNb3JlKVxyXG4gICAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICAgdmFyIHR5cGUgPSAnbmV4dCc7XHJcbiAgICAgICAgICB2YXIgbWV0aG9kID0gJ2FwcGVuZCc7XHJcbiAgICAgICAgICB2YXIgaGlkZSA9IHNlbGYub3B0aW9ucy5jbGFzc0xvYWRNb3JlO1xyXG5cclxuICAgICAgICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKHNlbGYub3B0aW9ucy5jbGFzc0xvYWRMZXNzKSkge1xyXG4gICAgICAgICAgICB0eXBlID0gJ3ByZXYnO1xyXG4gICAgICAgICAgICBtZXRob2QgPSAncHJlcGVuZCc7XHJcbiAgICAgICAgICAgIGhpZGUgPSBzZWxmLm9wdGlvbnMuY2xhc3NMb2FkTGVzcztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgcGFnZUJ5VHlwZSA9IHNlbGYuX2dldFBhZ2VCeVR5cGUodHlwZSk7XHJcblxyXG4gICAgICAgICAgdmFyIHJlcXVlc3QgPSAkLmV4dGVuZCh7fSwgc2VsZi5yZXF1ZXN0KTtcclxuICAgICAgICAgIHJlcXVlc3QucXVlcnkuUGFnZU51bWJlciA9IHBhZ2VCeVR5cGUuc2hvd1BhZ2U7XHJcbiAgICAgICAgICBzZWxmLl9zYXZlQ29va2llKHJlcXVlc3QpO1xyXG5cclxuICAgICAgICAgIHNlbGYuX2xvYWROZXh0KHBhZ2VCeVR5cGUpID9cclxuICAgICAgICAgICAgc2VsZi5sb2FkKG1ldGhvZCwgcGFnZUJ5VHlwZS5uZXh0UGFnZSkgOlxyXG4gICAgICAgICAgICBzZWxmLl9oaWRlQnV0dG9uKGhpZGUpXHJcblxyXG4gICAgICAgICAgc2VsZi5fc2V0VXJsSGFzaChwYWdlQnlUeXBlLnNob3dQYWdlKTtcclxuICAgICAgICAgIHNlbGYuX3Nob3dJdGVtcyhwYWdlQnlUeXBlLnNob3dQYWdlKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgYmluZE9yZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgIGlmIChzZWxmLm9wdGlvbnMuJHNlbGVjdE9yZGVyLmF0dHIoJ2lkJykgPT09ICdPJykge1xyXG4gICAgICAgIHNlbGYub3B0aW9ucy4kc2VsZWN0T3JkZXJcclxuICAgICAgICAgIC5yZW1vdmVBdHRyKCdvbmNoYW5nZScpXHJcbiAgICAgICAgICAudW5iaW5kKCdjaGFuZ2UnKVxyXG4gICAgICAgICAgLm9mZignY2hhbmdlJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNlbGYub3B0aW9ucy4kc2VsZWN0T3JkZXJcclxuICAgICAgICAub24oJ2NoYW5nZScsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICB2YXIgX3RoaXMgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIHZhbHVlID0gX3RoaXMudmFsKCk7XHJcblxyXG4gICAgICAgICAgc2VsZi5vcHRpb25zLiRyZXN1bHQudHJpZ2dlcigndnRleHNlYXJjaC5iZWZvcmVDaGFuZ2VPcmRlcicsIFsgc2VsZi5vcHRpb25zLCBzZWxmLnJlcXVlc3QsIF90aGlzIF0pO1xyXG4gICAgICAgICAgc2VsZi5fc2V0VXJsSGFzaCgxKTtcclxuICAgICAgICAgIHNlbGYuX2NoYW5nZU9yZGVyKHZhbHVlLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHNlbGYub3B0aW9ucy4kcmVzdWx0LnRyaWdnZXIoJ3Z0ZXhzZWFyY2guYWZ0ZXJDaGFuZ2VPcmRlcicsIFsgc2VsZi5vcHRpb25zLCBzZWxmLnJlcXVlc3QsIF90aGlzIF0pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9jaGFuZ2VPcmRlcjogZnVuY3Rpb24gKHZhbHVlLCBjYWxsYmFjaykge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICBzZWxmLnJlcXVlc3QucXVlcnkuTyA9IHZhbHVlO1xyXG5cclxuICAgICAgc2VsZi5fY29uY2F0UmVxdWVzdCgpO1xyXG4gICAgICBzZWxmLl9zZXRVcmxIYXNoKDEpO1xyXG5cclxuICAgICAgc2VsZi5fbG9hZEZpcnN0KGNhbGxiYWNrKTtcclxuICAgIH0sXHJcblxyXG4gICAgYmluZEZpbHRlcnM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgc2VsZi5vcHRpb25zLiRmaWx0ZXJzLm9uKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC50YXJnZXQudGFnTmFtZSAhPT0gJ0lOUFVUJykge1xyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgX3RoaXMgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciAkY2hlY2tib3ggPSBfdGhpcy5maW5kKCdpbnB1dCcpO1xyXG4gICAgICAgIHZhciBjaGVja2VkID0gJGNoZWNrYm94LmlzKCc6Y2hlY2tlZCcpO1xyXG4gICAgICAgIHZhciBmaWx0ZXIgPSAkY2hlY2tib3guYXR0cigncmVsJyk7XHJcblxyXG4gICAgICAgIGlmIChjaGVja2VkKSB7XHJcbiAgICAgICAgICBfdGhpcy5hZGRDbGFzcyhzZWxmLm9wdGlvbnMuY2xhc3NGaWx0ZXJBY3RpdmUpO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgX3RoaXMucmVtb3ZlQ2xhc3Moc2VsZi5vcHRpb25zLmNsYXNzRmlsdGVyQWN0aXZlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGYub3B0aW9ucy4kcmVzdWx0LnRyaWdnZXIoJ3Z0ZXhzZWFyY2guYmVmb3JlRmlsdGVyJywgWyBzZWxmLm9wdGlvbnMsIHNlbGYucmVxdWVzdCwgX3RoaXMgXSk7XHJcbiAgICAgICAgc2VsZi5fcmVmcmVzaEZpbHRlcihmaWx0ZXIsIGNoZWNrZWQsIF90aGlzKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVmcmVzaCBmaWx0ZXJcclxuICAgICAqIEBwYXJhbSAge3N0cmluZyxhcnJheX0gZmlsdGVyIEZpbHRlclxyXG4gICAgICogQHBhcmFtICB7Ym9vbGVhbn0gYWN0aW9uIHRydWU6IGFkZDsgZmFsc2U6IHJlbW92ZVxyXG4gICAgICovXHJcbiAgICBfcmVmcmVzaEZpbHRlcjogZnVuY3Rpb24gKGZpbHRlciwgYWN0aW9uLCBfdGhpcykge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICB2YXIgZmlsdGVyTWFwID0gZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICB2YXIgZmlsdGVyU3BsaXQgPSBpdGVtLnNwbGl0KCc9Jyk7XHJcblxyXG4gICAgICAgIHZhciBrZXkgPSBmaWx0ZXJTcGxpdFswXTtcclxuICAgICAgICB2YXIgdmFsdWUgPSBmaWx0ZXJTcGxpdFsxXTtcclxuXHJcbiAgICAgICAgaWYgKGFjdGlvbikge1xyXG4gICAgICAgICAgc2VsZi5yZXF1ZXN0LnF1ZXJ5W2tleV0ucHVzaCh2YWx1ZSk7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB2YXIgaW5kZXggPSBzZWxmLnJlcXVlc3QucXVlcnlba2V5XS5pbmRleE9mKHZhbHVlKTtcclxuXHJcbiAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICBzZWxmLnJlcXVlc3QucXVlcnlba2V5XS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgZmlsdGVyLm1hcChmaWx0ZXJNYXApO1xyXG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgZmlsdGVyTWFwKGZpbHRlcik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNlbGYuX2xvYWRGaXJzdChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgc2VsZi5vcHRpb25zLiRyZXN1bHQudHJpZ2dlcigndnRleHNlYXJjaC5hZnRlckZpbHRlcicsIFsgc2VsZi5vcHRpb25zLCBzZWxmLnJlcXVlc3QsIF90aGlzIHx8IG51bGwgXSk7XHJcbiAgICAgICAgc2VsZi5fc2V0VXJsSGFzaCgxKTtcclxuXHJcbiAgICAgICAgaWYgKHNlbGYub3B0aW9ucy5wYWdpbmF0aW9uKSB7XHJcbiAgICAgICAgICBzZWxmLl9jbGVhclBhZ2luYXRpb24oKTtcclxuICAgICAgICAgIHNlbGYuX2NyZWF0ZVBhZ2luYXRpb24oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGYuYmluZFBhZ2luYXRpb24oKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGJpbmRQYWdpbmF0aW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICQoJy4nKyBzZWxmLm9wdGlvbnMuY2xhc3NQYWdpbmF0aW9uKS5maW5kKCdidXR0b24nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgdmFyIF90aGlzID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgcGFnZSA9IHBhcnNlSW50KF90aGlzLmF0dHIoJ3BhZ2UnKSk7XHJcblxyXG4gICAgICAgIHNlbGYub3B0aW9ucy4kcmVzdWx0LnRyaWdnZXIoJ3Z0ZXhzZWFyY2guYmVmb3JlQ2hhbmdlUGFnZScsIFsgc2VsZi5vcHRpb25zLCBzZWxmLnJlcXVlc3QgXSk7XHJcblxyXG4gICAgICAgIHNlbGYubG9hZCgnaHRtbCcsIHBhZ2UsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHNlbGYuX3NldFVybEhhc2gocGFnZSk7XHJcbiAgICAgICAgICBzZWxmLl9zaG93SXRlbXMocGFnZSk7XHJcblxyXG4gICAgICAgICAgc2VsZi5yZXF1ZXN0LnF1ZXJ5LlBhZ2VOdW1iZXIgPSBwYWdlO1xyXG4gICAgICAgICAgc2VsZi5fY2xlYXJQYWdpbmF0aW9uKCk7XHJcbiAgICAgICAgICBzZWxmLl9zdGFydFBhZ2luYXRpb24oKTtcclxuICAgICAgICAgIHNlbGYuX2NvbmNhdFJlcXVlc3QoKTtcclxuICAgICAgICAgIHNlbGYuX3NhdmVDb29raWUoKTtcclxuXHJcbiAgICAgICAgICBzZWxmLm9wdGlvbnMuJHJlc3VsdC50cmlnZ2VyKCd2dGV4c2VhcmNoLmFmdGVyQ2hhbmdlUGFnZScsIFsgc2VsZi5vcHRpb25zLCBzZWxmLnJlcXVlc3QgXSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcblxyXG4gICAgLy8gICAgICAgICAgICAgIF8gICBfXHJcbiAgICAvLyAgIF9fXyAgXyBfXyB8IHxfKF8pIF9fXyAgXyBfXyAgX19fXHJcbiAgICAvLyAgLyBfIFxcfCAnXyBcXHwgX198IHwvIF8gXFx8ICdfIFxcLyBfX3xcclxuICAgIC8vIHwgKF8pIHwgfF8pIHwgfF98IHwgKF8pIHwgfCB8IFxcX18gXFxcclxuICAgIC8vICBcXF9fXy98IC5fXy8gXFxfX3xffFxcX19fL3xffCB8X3xfX18vXHJcbiAgICAvLyAgICAgICB8X3xcclxuXHJcbiAgICBnZXREZWZhdWx0T3B0aW9uczogZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEVsZW1lbnRzXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgJHJlc3VsdEl0ZW1zV3JhcHBlcjogJCgnLnJlc3VsdEl0ZW1zV3JhcHBlcicpLFxyXG4gICAgICAgICRzY3JpcHQ6ICQoJy5yZXN1bHRJdGVtc1dyYXBwZXInKS5jaGlsZHJlbignc2NyaXB0JyksXHJcbiAgICAgICAgJHBhZ2VyOiAkKCcucGFnZXInKSxcclxuICAgICAgICAkdG90YWxJdGVtczogJCgnLnNlYXJjaFJlc3VsdHNUaW1lOmZpcnN0IC5yZXN1bHRhZG8tYnVzY2EtbnVtZXJvIC52YWx1ZScpLFxyXG4gICAgICAgICRzZWxlY3RPcmRlcjogJCgnI08nKSxcclxuICAgICAgICAkZmlsdGVyczogJCgnLnNlYXJjaC1tdWx0aXBsZS1uYXZpZ2F0b3IgbGFiZWwnKSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ2xhc3Nlc1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNsYXNzRmlsdGVyQWN0aXZlOiAnZmlsdGVyLS1hY3RpdmUnLFxyXG4gICAgICAgIGNsYXNzSXRlbVByZUxvYWQ6ICdzaGVsZi1pdGVtLS1wcmVsb2FkJyxcclxuICAgICAgICBjbGFzc0xvYWRCdG5IaWRlOiAnbG9hZC1idG4tLWhpZGUnLFxyXG4gICAgICAgIGNsYXNzTG9hZExlc3M6ICdsb2FkLWxlc3MnLFxyXG4gICAgICAgIGNsYXNzTG9hZE1vcmU6ICdsb2FkLW1vcmUnLFxyXG4gICAgICAgIGNsYXNzUGFnaW5hdGlvbjogJ3BhZ2luYXRpb24nLFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUZXh0c1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRleHRMb2FkTGVzczogJ0xvYWQgbGVzcycsXHJcbiAgICAgICAgdGV4dExvYWRNb3JlOiAnTG9hZCBtb3JlJyxcclxuICAgICAgICB0ZXh0UGFnaW5hdGlvbkZpcnN0OiAnRmlyc3QnLFxyXG4gICAgICAgIHRleHRQYWdpbmF0aW9uUHJldjogJ1ByZXYnLFxyXG4gICAgICAgIHRleHRQYWdpbmF0aW9uTmV4dDogJ05leHQnLFxyXG4gICAgICAgIHRleHRQYWdpbmF0aW9uTGFzdDogJ0xhc3QnLFxyXG4gICAgICAgIHRleHRFbXB0eVJlc3VsdDogJ05vIHByb2R1Y3QgZm91bmQnLFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFBhZ2luYXRpb25cclxuICAgICAgICAgKi9cclxuICAgICAgICBwYWdpbmF0aW9uOiBmYWxzZSxcclxuICAgICAgICBwYWdpbmF0aW9uUmFuZ2VCdXR0b25zOiAzLFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBPdGhlcnNcclxuICAgICAgICAgKi9cclxuICAgICAgICBjb29raWVOYW1lOiAnVnRleFNlYXJjaFF1ZXJ5JyxcclxuICAgICAgICBkZWZhdWx0UGFyYW1zOiB7XHJcbiAgICAgICAgICAvLyAncXVlcnknOiB7XHJcbiAgICAgICAgICAvLyAgICdPJzogJ09yZGVyQnlQcmljZUFTQydcclxuICAgICAgICAgIC8vIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGF0dGVtcHRzOiAxXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICAkLmZuLnZ0ZXhTZWFyY2ggPSBmdW5jdGlvbiAoc2V0dGluZ3MpIHtcclxuICAgIHZhciAkcmVzdWx0ID0gdGhpcztcclxuXHJcbiAgICBWdGV4U2VhcmNoLmluaXQoJHJlc3VsdCwgc2V0dGluZ3MpO1xyXG5cclxuICAgIHJldHVybiAkcmVzdWx0O1xyXG4gIH07XHJcbn0oalF1ZXJ5KSk7XHJcbiIsIi8qXG4gICAgIF8gXyAgICAgIF8gICAgICAgX1xuIF9fX3wgKF8pIF9fX3wgfCBfXyAgKF8pX19fXG4vIF9ffCB8IHwvIF9ffCB8LyAvICB8IC8gX198XG5cXF9fIFxcIHwgfCAoX198ICAgPCBfIHwgXFxfXyBcXFxufF9fXy9ffF98XFxfX198X3xcXF8oXykvIHxfX18vXG4gICAgICAgICAgICAgICAgICAgfF9fL1xuXG4gVmVyc2lvbjogMS44LjBcbiAgQXV0aG9yOiBLZW4gV2hlZWxlclxuIFdlYnNpdGU6IGh0dHA6Ly9rZW53aGVlbGVyLmdpdGh1Yi5pb1xuICAgIERvY3M6IGh0dHA6Ly9rZW53aGVlbGVyLmdpdGh1Yi5pby9zbGlja1xuICAgIFJlcG86IGh0dHA6Ly9naXRodWIuY29tL2tlbndoZWVsZXIvc2xpY2tcbiAgSXNzdWVzOiBodHRwOi8vZ2l0aHViLmNvbS9rZW53aGVlbGVyL3NsaWNrL2lzc3Vlc1xuXG4gKi9cbi8qIGdsb2JhbCB3aW5kb3csIGRvY3VtZW50LCBkZWZpbmUsIGpRdWVyeSwgc2V0SW50ZXJ2YWwsIGNsZWFySW50ZXJ2YWwgKi9cbjsoZnVuY3Rpb24oZmFjdG9yeSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoalF1ZXJ5KTtcbiAgICB9XG5cbn0oZnVuY3Rpb24oJCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgU2xpY2sgPSB3aW5kb3cuU2xpY2sgfHwge307XG5cbiAgICBTbGljayA9IChmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgaW5zdGFuY2VVaWQgPSAwO1xuXG4gICAgICAgIGZ1bmN0aW9uIFNsaWNrKGVsZW1lbnQsIHNldHRpbmdzKSB7XG5cbiAgICAgICAgICAgIHZhciBfID0gdGhpcywgZGF0YVNldHRpbmdzO1xuXG4gICAgICAgICAgICBfLmRlZmF1bHRzID0ge1xuICAgICAgICAgICAgICAgIGFjY2Vzc2liaWxpdHk6IHRydWUsXG4gICAgICAgICAgICAgICAgYWRhcHRpdmVIZWlnaHQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGFwcGVuZEFycm93czogJChlbGVtZW50KSxcbiAgICAgICAgICAgICAgICBhcHBlbmREb3RzOiAkKGVsZW1lbnQpLFxuICAgICAgICAgICAgICAgIGFycm93czogdHJ1ZSxcbiAgICAgICAgICAgICAgICBhc05hdkZvcjogbnVsbCxcbiAgICAgICAgICAgICAgICBwcmV2QXJyb3c6ICc8YnV0dG9uIGNsYXNzPVwic2xpY2stcHJldlwiIGFyaWEtbGFiZWw9XCJQcmV2aW91c1wiIHR5cGU9XCJidXR0b25cIj5QcmV2aW91czwvYnV0dG9uPicsXG4gICAgICAgICAgICAgICAgbmV4dEFycm93OiAnPGJ1dHRvbiBjbGFzcz1cInNsaWNrLW5leHRcIiBhcmlhLWxhYmVsPVwiTmV4dFwiIHR5cGU9XCJidXR0b25cIj5OZXh0PC9idXR0b24+JyxcbiAgICAgICAgICAgICAgICBhdXRvcGxheTogZmFsc2UsXG4gICAgICAgICAgICAgICAgYXV0b3BsYXlTcGVlZDogMzAwMCxcbiAgICAgICAgICAgICAgICBjZW50ZXJNb2RlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjZW50ZXJQYWRkaW5nOiAnNTBweCcsXG4gICAgICAgICAgICAgICAgY3NzRWFzZTogJ2Vhc2UnLFxuICAgICAgICAgICAgICAgIGN1c3RvbVBhZ2luZzogZnVuY3Rpb24oc2xpZGVyLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkKCc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiAvPicpLnRleHQoaSArIDEpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZG90czogZmFsc2UsXG4gICAgICAgICAgICAgICAgZG90c0NsYXNzOiAnc2xpY2stZG90cycsXG4gICAgICAgICAgICAgICAgZHJhZ2dhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGVhc2luZzogJ2xpbmVhcicsXG4gICAgICAgICAgICAgICAgZWRnZUZyaWN0aW9uOiAwLjM1LFxuICAgICAgICAgICAgICAgIGZhZGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGZvY3VzT25TZWxlY3Q6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGZvY3VzT25DaGFuZ2U6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGluZmluaXRlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGluaXRpYWxTbGlkZTogMCxcbiAgICAgICAgICAgICAgICBsYXp5TG9hZDogJ29uZGVtYW5kJyxcbiAgICAgICAgICAgICAgICBtb2JpbGVGaXJzdDogZmFsc2UsXG4gICAgICAgICAgICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgICAgICAgICAgIHBhdXNlT25Gb2N1czogdHJ1ZSxcbiAgICAgICAgICAgICAgICBwYXVzZU9uRG90c0hvdmVyOiBmYWxzZSxcbiAgICAgICAgICAgICAgICByZXNwb25kVG86ICd3aW5kb3cnLFxuICAgICAgICAgICAgICAgIHJlc3BvbnNpdmU6IG51bGwsXG4gICAgICAgICAgICAgICAgcm93czogMSxcbiAgICAgICAgICAgICAgICBydGw6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHNsaWRlOiAnJyxcbiAgICAgICAgICAgICAgICBzbGlkZXNQZXJSb3c6IDEsXG4gICAgICAgICAgICAgICAgc2xpZGVzVG9TaG93OiAxLFxuICAgICAgICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxLFxuICAgICAgICAgICAgICAgIHNwZWVkOiA1MDAsXG4gICAgICAgICAgICAgICAgc3dpcGU6IHRydWUsXG4gICAgICAgICAgICAgICAgc3dpcGVUb1NsaWRlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB0b3VjaE1vdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgdG91Y2hUaHJlc2hvbGQ6IDUsXG4gICAgICAgICAgICAgICAgdXNlQ1NTOiB0cnVlLFxuICAgICAgICAgICAgICAgIHVzZVRyYW5zZm9ybTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZVdpZHRoOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB2ZXJ0aWNhbDogZmFsc2UsXG4gICAgICAgICAgICAgICAgdmVydGljYWxTd2lwaW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB3YWl0Rm9yQW5pbWF0ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB6SW5kZXg6IDEwMDBcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIF8uaW5pdGlhbHMgPSB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkcmFnZ2luZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgYXV0b1BsYXlUaW1lcjogbnVsbCxcbiAgICAgICAgICAgICAgICBjdXJyZW50RGlyZWN0aW9uOiAwLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRMZWZ0OiBudWxsLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRTbGlkZTogMCxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IDEsXG4gICAgICAgICAgICAgICAgJGRvdHM6IG51bGwsXG4gICAgICAgICAgICAgICAgbGlzdFdpZHRoOiBudWxsLFxuICAgICAgICAgICAgICAgIGxpc3RIZWlnaHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbG9hZEluZGV4OiAwLFxuICAgICAgICAgICAgICAgICRuZXh0QXJyb3c6IG51bGwsXG4gICAgICAgICAgICAgICAgJHByZXZBcnJvdzogbnVsbCxcbiAgICAgICAgICAgICAgICBzY3JvbGxpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHNsaWRlQ291bnQ6IG51bGwsXG4gICAgICAgICAgICAgICAgc2xpZGVXaWR0aDogbnVsbCxcbiAgICAgICAgICAgICAgICAkc2xpZGVUcmFjazogbnVsbCxcbiAgICAgICAgICAgICAgICAkc2xpZGVzOiBudWxsLFxuICAgICAgICAgICAgICAgIHNsaWRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHNsaWRlT2Zmc2V0OiAwLFxuICAgICAgICAgICAgICAgIHN3aXBlTGVmdDogbnVsbCxcbiAgICAgICAgICAgICAgICBzd2lwaW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAkbGlzdDogbnVsbCxcbiAgICAgICAgICAgICAgICB0b3VjaE9iamVjdDoge30sXG4gICAgICAgICAgICAgICAgdHJhbnNmb3Jtc0VuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHVuc2xpY2tlZDogZmFsc2VcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICQuZXh0ZW5kKF8sIF8uaW5pdGlhbHMpO1xuXG4gICAgICAgICAgICBfLmFjdGl2ZUJyZWFrcG9pbnQgPSBudWxsO1xuICAgICAgICAgICAgXy5hbmltVHlwZSA9IG51bGw7XG4gICAgICAgICAgICBfLmFuaW1Qcm9wID0gbnVsbDtcbiAgICAgICAgICAgIF8uYnJlYWtwb2ludHMgPSBbXTtcbiAgICAgICAgICAgIF8uYnJlYWtwb2ludFNldHRpbmdzID0gW107XG4gICAgICAgICAgICBfLmNzc1RyYW5zaXRpb25zID0gZmFsc2U7XG4gICAgICAgICAgICBfLmZvY3Vzc2VkID0gZmFsc2U7XG4gICAgICAgICAgICBfLmludGVycnVwdGVkID0gZmFsc2U7XG4gICAgICAgICAgICBfLmhpZGRlbiA9ICdoaWRkZW4nO1xuICAgICAgICAgICAgXy5wYXVzZWQgPSB0cnVlO1xuICAgICAgICAgICAgXy5wb3NpdGlvblByb3AgPSBudWxsO1xuICAgICAgICAgICAgXy5yZXNwb25kVG8gPSBudWxsO1xuICAgICAgICAgICAgXy5yb3dDb3VudCA9IDE7XG4gICAgICAgICAgICBfLnNob3VsZENsaWNrID0gdHJ1ZTtcbiAgICAgICAgICAgIF8uJHNsaWRlciA9ICQoZWxlbWVudCk7XG4gICAgICAgICAgICBfLiRzbGlkZXNDYWNoZSA9IG51bGw7XG4gICAgICAgICAgICBfLnRyYW5zZm9ybVR5cGUgPSBudWxsO1xuICAgICAgICAgICAgXy50cmFuc2l0aW9uVHlwZSA9IG51bGw7XG4gICAgICAgICAgICBfLnZpc2liaWxpdHlDaGFuZ2UgPSAndmlzaWJpbGl0eWNoYW5nZSc7XG4gICAgICAgICAgICBfLndpbmRvd1dpZHRoID0gMDtcbiAgICAgICAgICAgIF8ud2luZG93VGltZXIgPSBudWxsO1xuXG4gICAgICAgICAgICBkYXRhU2V0dGluZ3MgPSAkKGVsZW1lbnQpLmRhdGEoJ3NsaWNrJykgfHwge307XG5cbiAgICAgICAgICAgIF8ub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBfLmRlZmF1bHRzLCBzZXR0aW5ncywgZGF0YVNldHRpbmdzKTtcblxuICAgICAgICAgICAgXy5jdXJyZW50U2xpZGUgPSBfLm9wdGlvbnMuaW5pdGlhbFNsaWRlO1xuXG4gICAgICAgICAgICBfLm9yaWdpbmFsU2V0dGluZ3MgPSBfLm9wdGlvbnM7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQubW96SGlkZGVuICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIF8uaGlkZGVuID0gJ21vekhpZGRlbic7XG4gICAgICAgICAgICAgICAgXy52aXNpYmlsaXR5Q2hhbmdlID0gJ21venZpc2liaWxpdHljaGFuZ2UnO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQud2Via2l0SGlkZGVuICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIF8uaGlkZGVuID0gJ3dlYmtpdEhpZGRlbic7XG4gICAgICAgICAgICAgICAgXy52aXNpYmlsaXR5Q2hhbmdlID0gJ3dlYmtpdHZpc2liaWxpdHljaGFuZ2UnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfLmF1dG9QbGF5ID0gJC5wcm94eShfLmF1dG9QbGF5LCBfKTtcbiAgICAgICAgICAgIF8uYXV0b1BsYXlDbGVhciA9ICQucHJveHkoXy5hdXRvUGxheUNsZWFyLCBfKTtcbiAgICAgICAgICAgIF8uYXV0b1BsYXlJdGVyYXRvciA9ICQucHJveHkoXy5hdXRvUGxheUl0ZXJhdG9yLCBfKTtcbiAgICAgICAgICAgIF8uY2hhbmdlU2xpZGUgPSAkLnByb3h5KF8uY2hhbmdlU2xpZGUsIF8pO1xuICAgICAgICAgICAgXy5jbGlja0hhbmRsZXIgPSAkLnByb3h5KF8uY2xpY2tIYW5kbGVyLCBfKTtcbiAgICAgICAgICAgIF8uc2VsZWN0SGFuZGxlciA9ICQucHJveHkoXy5zZWxlY3RIYW5kbGVyLCBfKTtcbiAgICAgICAgICAgIF8uc2V0UG9zaXRpb24gPSAkLnByb3h5KF8uc2V0UG9zaXRpb24sIF8pO1xuICAgICAgICAgICAgXy5zd2lwZUhhbmRsZXIgPSAkLnByb3h5KF8uc3dpcGVIYW5kbGVyLCBfKTtcbiAgICAgICAgICAgIF8uZHJhZ0hhbmRsZXIgPSAkLnByb3h5KF8uZHJhZ0hhbmRsZXIsIF8pO1xuICAgICAgICAgICAgXy5rZXlIYW5kbGVyID0gJC5wcm94eShfLmtleUhhbmRsZXIsIF8pO1xuXG4gICAgICAgICAgICBfLmluc3RhbmNlVWlkID0gaW5zdGFuY2VVaWQrKztcblxuICAgICAgICAgICAgLy8gQSBzaW1wbGUgd2F5IHRvIGNoZWNrIGZvciBIVE1MIHN0cmluZ3NcbiAgICAgICAgICAgIC8vIFN0cmljdCBIVE1MIHJlY29nbml0aW9uIChtdXN0IHN0YXJ0IHdpdGggPClcbiAgICAgICAgICAgIC8vIEV4dHJhY3RlZCBmcm9tIGpRdWVyeSB2MS4xMSBzb3VyY2VcbiAgICAgICAgICAgIF8uaHRtbEV4cHIgPSAvXig/OlxccyooPFtcXHdcXFddKz4pW14+XSopJC87XG5cblxuICAgICAgICAgICAgXy5yZWdpc3RlckJyZWFrcG9pbnRzKCk7XG4gICAgICAgICAgICBfLmluaXQodHJ1ZSk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBTbGljaztcblxuICAgIH0oKSk7XG5cbiAgICBTbGljay5wcm90b3R5cGUuYWN0aXZhdGVBREEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuXG4gICAgICAgIF8uJHNsaWRlVHJhY2suZmluZCgnLnNsaWNrLWFjdGl2ZScpLmF0dHIoe1xuICAgICAgICAgICAgJ2FyaWEtaGlkZGVuJzogJ2ZhbHNlJ1xuICAgICAgICB9KS5maW5kKCdhLCBpbnB1dCwgYnV0dG9uLCBzZWxlY3QnKS5hdHRyKHtcbiAgICAgICAgICAgICd0YWJpbmRleCc6ICcwJ1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuYWRkU2xpZGUgPSBTbGljay5wcm90b3R5cGUuc2xpY2tBZGQgPSBmdW5jdGlvbihtYXJrdXAsIGluZGV4LCBhZGRCZWZvcmUpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHR5cGVvZihpbmRleCkgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgYWRkQmVmb3JlID0gaW5kZXg7XG4gICAgICAgICAgICBpbmRleCA9IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5kZXggPCAwIHx8IChpbmRleCA+PSBfLnNsaWRlQ291bnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBfLnVubG9hZCgpO1xuXG4gICAgICAgIGlmICh0eXBlb2YoaW5kZXgpID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSAwICYmIF8uJHNsaWRlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAkKG1hcmt1cCkuYXBwZW5kVG8oXy4kc2xpZGVUcmFjayk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFkZEJlZm9yZSkge1xuICAgICAgICAgICAgICAgICQobWFya3VwKS5pbnNlcnRCZWZvcmUoXy4kc2xpZGVzLmVxKGluZGV4KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQobWFya3VwKS5pbnNlcnRBZnRlcihfLiRzbGlkZXMuZXEoaW5kZXgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChhZGRCZWZvcmUgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAkKG1hcmt1cCkucHJlcGVuZFRvKF8uJHNsaWRlVHJhY2spO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkKG1hcmt1cCkuYXBwZW5kVG8oXy4kc2xpZGVUcmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBfLiRzbGlkZXMgPSBfLiRzbGlkZVRyYWNrLmNoaWxkcmVuKHRoaXMub3B0aW9ucy5zbGlkZSk7XG5cbiAgICAgICAgXy4kc2xpZGVUcmFjay5jaGlsZHJlbih0aGlzLm9wdGlvbnMuc2xpZGUpLmRldGFjaCgpO1xuXG4gICAgICAgIF8uJHNsaWRlVHJhY2suYXBwZW5kKF8uJHNsaWRlcyk7XG5cbiAgICAgICAgXy4kc2xpZGVzLmVhY2goZnVuY3Rpb24oaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICQoZWxlbWVudCkuYXR0cignZGF0YS1zbGljay1pbmRleCcsIGluZGV4KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgXy4kc2xpZGVzQ2FjaGUgPSBfLiRzbGlkZXM7XG5cbiAgICAgICAgXy5yZWluaXQoKTtcblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuYW5pbWF0ZUhlaWdodCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgXyA9IHRoaXM7XG4gICAgICAgIGlmIChfLm9wdGlvbnMuc2xpZGVzVG9TaG93ID09PSAxICYmIF8ub3B0aW9ucy5hZGFwdGl2ZUhlaWdodCA9PT0gdHJ1ZSAmJiBfLm9wdGlvbnMudmVydGljYWwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0SGVpZ2h0ID0gXy4kc2xpZGVzLmVxKF8uY3VycmVudFNsaWRlKS5vdXRlckhlaWdodCh0cnVlKTtcbiAgICAgICAgICAgIF8uJGxpc3QuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB0YXJnZXRIZWlnaHRcbiAgICAgICAgICAgIH0sIF8ub3B0aW9ucy5zcGVlZCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmFuaW1hdGVTbGlkZSA9IGZ1bmN0aW9uKHRhcmdldExlZnQsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgdmFyIGFuaW1Qcm9wcyA9IHt9LFxuICAgICAgICAgICAgXyA9IHRoaXM7XG5cbiAgICAgICAgXy5hbmltYXRlSGVpZ2h0KCk7XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5ydGwgPT09IHRydWUgJiYgXy5vcHRpb25zLnZlcnRpY2FsID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGFyZ2V0TGVmdCA9IC10YXJnZXRMZWZ0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLnRyYW5zZm9ybXNFbmFibGVkID09PSBmYWxzZSkge1xuICAgICAgICAgICAgaWYgKF8ub3B0aW9ucy52ZXJ0aWNhbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBfLiRzbGlkZVRyYWNrLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgICAgICBsZWZ0OiB0YXJnZXRMZWZ0XG4gICAgICAgICAgICAgICAgfSwgXy5vcHRpb25zLnNwZWVkLCBfLm9wdGlvbnMuZWFzaW5nLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIF8uJHNsaWRlVHJhY2suYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIHRvcDogdGFyZ2V0TGVmdFxuICAgICAgICAgICAgICAgIH0sIF8ub3B0aW9ucy5zcGVlZCwgXy5vcHRpb25zLmVhc2luZywgY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGlmIChfLmNzc1RyYW5zaXRpb25zID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGlmIChfLm9wdGlvbnMucnRsID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIF8uY3VycmVudExlZnQgPSAtKF8uY3VycmVudExlZnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkKHtcbiAgICAgICAgICAgICAgICAgICAgYW5pbVN0YXJ0OiBfLmN1cnJlbnRMZWZ0XG4gICAgICAgICAgICAgICAgfSkuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1TdGFydDogdGFyZ2V0TGVmdFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IF8ub3B0aW9ucy5zcGVlZCxcbiAgICAgICAgICAgICAgICAgICAgZWFzaW5nOiBfLm9wdGlvbnMuZWFzaW5nLFxuICAgICAgICAgICAgICAgICAgICBzdGVwOiBmdW5jdGlvbihub3cpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vdyA9IE1hdGguY2VpbChub3cpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF8ub3B0aW9ucy52ZXJ0aWNhbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltUHJvcHNbXy5hbmltVHlwZV0gPSAndHJhbnNsYXRlKCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3cgKyAncHgsIDBweCknO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uJHNsaWRlVHJhY2suY3NzKGFuaW1Qcm9wcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1Qcm9wc1tfLmFuaW1UeXBlXSA9ICd0cmFuc2xhdGUoMHB4LCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3cgKyAncHgpJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLiRzbGlkZVRyYWNrLmNzcyhhbmltUHJvcHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIF8uYXBwbHlUcmFuc2l0aW9uKCk7XG4gICAgICAgICAgICAgICAgdGFyZ2V0TGVmdCA9IE1hdGguY2VpbCh0YXJnZXRMZWZ0KTtcblxuICAgICAgICAgICAgICAgIGlmIChfLm9wdGlvbnMudmVydGljYWwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1Qcm9wc1tfLmFuaW1UeXBlXSA9ICd0cmFuc2xhdGUzZCgnICsgdGFyZ2V0TGVmdCArICdweCwgMHB4LCAwcHgpJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhbmltUHJvcHNbXy5hbmltVHlwZV0gPSAndHJhbnNsYXRlM2QoMHB4LCcgKyB0YXJnZXRMZWZ0ICsgJ3B4LCAwcHgpJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXy4kc2xpZGVUcmFjay5jc3MoYW5pbVByb3BzKTtcblxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBfLmRpc2FibGVUcmFuc2l0aW9uKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgXy5vcHRpb25zLnNwZWVkKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmdldE5hdlRhcmdldCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcyxcbiAgICAgICAgICAgIGFzTmF2Rm9yID0gXy5vcHRpb25zLmFzTmF2Rm9yO1xuXG4gICAgICAgIGlmICggYXNOYXZGb3IgJiYgYXNOYXZGb3IgIT09IG51bGwgKSB7XG4gICAgICAgICAgICBhc05hdkZvciA9ICQoYXNOYXZGb3IpLm5vdChfLiRzbGlkZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFzTmF2Rm9yO1xuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5hc05hdkZvciA9IGZ1bmN0aW9uKGluZGV4KSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzLFxuICAgICAgICAgICAgYXNOYXZGb3IgPSBfLmdldE5hdlRhcmdldCgpO1xuXG4gICAgICAgIGlmICggYXNOYXZGb3IgIT09IG51bGwgJiYgdHlwZW9mIGFzTmF2Rm9yID09PSAnb2JqZWN0JyApIHtcbiAgICAgICAgICAgIGFzTmF2Rm9yLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQodGhpcykuc2xpY2soJ2dldFNsaWNrJyk7XG4gICAgICAgICAgICAgICAgaWYoIXRhcmdldC51bnNsaWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNsaWRlSGFuZGxlcihpbmRleCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuYXBwbHlUcmFuc2l0aW9uID0gZnVuY3Rpb24oc2xpZGUpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXMsXG4gICAgICAgICAgICB0cmFuc2l0aW9uID0ge307XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5mYWRlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdHJhbnNpdGlvbltfLnRyYW5zaXRpb25UeXBlXSA9IF8udHJhbnNmb3JtVHlwZSArICcgJyArIF8ub3B0aW9ucy5zcGVlZCArICdtcyAnICsgXy5vcHRpb25zLmNzc0Vhc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0cmFuc2l0aW9uW18udHJhbnNpdGlvblR5cGVdID0gJ29wYWNpdHkgJyArIF8ub3B0aW9ucy5zcGVlZCArICdtcyAnICsgXy5vcHRpb25zLmNzc0Vhc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5vcHRpb25zLmZhZGUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBfLiRzbGlkZVRyYWNrLmNzcyh0cmFuc2l0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF8uJHNsaWRlcy5lcShzbGlkZSkuY3NzKHRyYW5zaXRpb24pO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmF1dG9QbGF5ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuXG4gICAgICAgIF8uYXV0b1BsYXlDbGVhcigpO1xuXG4gICAgICAgIGlmICggXy5zbGlkZUNvdW50ID4gXy5vcHRpb25zLnNsaWRlc1RvU2hvdyApIHtcbiAgICAgICAgICAgIF8uYXV0b1BsYXlUaW1lciA9IHNldEludGVydmFsKCBfLmF1dG9QbGF5SXRlcmF0b3IsIF8ub3B0aW9ucy5hdXRvcGxheVNwZWVkICk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuYXV0b1BsYXlDbGVhciA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBpZiAoXy5hdXRvUGxheVRpbWVyKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKF8uYXV0b1BsYXlUaW1lcik7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuYXV0b1BsYXlJdGVyYXRvciA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcyxcbiAgICAgICAgICAgIHNsaWRlVG8gPSBfLmN1cnJlbnRTbGlkZSArIF8ub3B0aW9ucy5zbGlkZXNUb1Njcm9sbDtcblxuICAgICAgICBpZiAoICFfLnBhdXNlZCAmJiAhXy5pbnRlcnJ1cHRlZCAmJiAhXy5mb2N1c3NlZCApIHtcblxuICAgICAgICAgICAgaWYgKCBfLm9wdGlvbnMuaW5maW5pdGUgPT09IGZhbHNlICkge1xuXG4gICAgICAgICAgICAgICAgaWYgKCBfLmRpcmVjdGlvbiA9PT0gMSAmJiAoIF8uY3VycmVudFNsaWRlICsgMSApID09PSAoIF8uc2xpZGVDb3VudCAtIDEgKSkge1xuICAgICAgICAgICAgICAgICAgICBfLmRpcmVjdGlvbiA9IDA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIF8uZGlyZWN0aW9uID09PSAwICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHNsaWRlVG8gPSBfLmN1cnJlbnRTbGlkZSAtIF8ub3B0aW9ucy5zbGlkZXNUb1Njcm9sbDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIF8uY3VycmVudFNsaWRlIC0gMSA9PT0gMCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF8uZGlyZWN0aW9uID0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF8uc2xpZGVIYW5kbGVyKCBzbGlkZVRvICk7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5idWlsZEFycm93cyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBpZiAoXy5vcHRpb25zLmFycm93cyA9PT0gdHJ1ZSApIHtcblxuICAgICAgICAgICAgXy4kcHJldkFycm93ID0gJChfLm9wdGlvbnMucHJldkFycm93KS5hZGRDbGFzcygnc2xpY2stYXJyb3cnKTtcbiAgICAgICAgICAgIF8uJG5leHRBcnJvdyA9ICQoXy5vcHRpb25zLm5leHRBcnJvdykuYWRkQ2xhc3MoJ3NsaWNrLWFycm93Jyk7XG5cbiAgICAgICAgICAgIGlmKCBfLnNsaWRlQ291bnQgPiBfLm9wdGlvbnMuc2xpZGVzVG9TaG93ICkge1xuXG4gICAgICAgICAgICAgICAgXy4kcHJldkFycm93LnJlbW92ZUNsYXNzKCdzbGljay1oaWRkZW4nKS5yZW1vdmVBdHRyKCdhcmlhLWhpZGRlbiB0YWJpbmRleCcpO1xuICAgICAgICAgICAgICAgIF8uJG5leHRBcnJvdy5yZW1vdmVDbGFzcygnc2xpY2staGlkZGVuJykucmVtb3ZlQXR0cignYXJpYS1oaWRkZW4gdGFiaW5kZXgnKTtcblxuICAgICAgICAgICAgICAgIGlmIChfLmh0bWxFeHByLnRlc3QoXy5vcHRpb25zLnByZXZBcnJvdykpIHtcbiAgICAgICAgICAgICAgICAgICAgXy4kcHJldkFycm93LnByZXBlbmRUbyhfLm9wdGlvbnMuYXBwZW5kQXJyb3dzKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoXy5odG1sRXhwci50ZXN0KF8ub3B0aW9ucy5uZXh0QXJyb3cpKSB7XG4gICAgICAgICAgICAgICAgICAgIF8uJG5leHRBcnJvdy5hcHBlbmRUbyhfLm9wdGlvbnMuYXBwZW5kQXJyb3dzKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoXy5vcHRpb25zLmluZmluaXRlICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIF8uJHByZXZBcnJvd1xuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdzbGljay1kaXNhYmxlZCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignYXJpYS1kaXNhYmxlZCcsICd0cnVlJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgXy4kcHJldkFycm93LmFkZCggXy4kbmV4dEFycm93IClcblxuICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3NsaWNrLWhpZGRlbicpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdhcmlhLWRpc2FibGVkJzogJ3RydWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3RhYmluZGV4JzogJy0xJ1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuYnVpbGREb3RzID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzLFxuICAgICAgICAgICAgaSwgZG90O1xuXG4gICAgICAgIGlmIChfLm9wdGlvbnMuZG90cyA9PT0gdHJ1ZSAmJiBfLnNsaWRlQ291bnQgPiBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KSB7XG5cbiAgICAgICAgICAgIF8uJHNsaWRlci5hZGRDbGFzcygnc2xpY2stZG90dGVkJyk7XG5cbiAgICAgICAgICAgIGRvdCA9ICQoJzx1bCAvPicpLmFkZENsYXNzKF8ub3B0aW9ucy5kb3RzQ2xhc3MpO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDw9IF8uZ2V0RG90Q291bnQoKTsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgZG90LmFwcGVuZCgkKCc8bGkgLz4nKS5hcHBlbmQoXy5vcHRpb25zLmN1c3RvbVBhZ2luZy5jYWxsKHRoaXMsIF8sIGkpKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF8uJGRvdHMgPSBkb3QuYXBwZW5kVG8oXy5vcHRpb25zLmFwcGVuZERvdHMpO1xuXG4gICAgICAgICAgICBfLiRkb3RzLmZpbmQoJ2xpJykuZmlyc3QoKS5hZGRDbGFzcygnc2xpY2stYWN0aXZlJyk7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5idWlsZE91dCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBfLiRzbGlkZXMgPVxuICAgICAgICAgICAgXy4kc2xpZGVyXG4gICAgICAgICAgICAgICAgLmNoaWxkcmVuKCBfLm9wdGlvbnMuc2xpZGUgKyAnOm5vdCguc2xpY2stY2xvbmVkKScpXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKCdzbGljay1zbGlkZScpO1xuXG4gICAgICAgIF8uc2xpZGVDb3VudCA9IF8uJHNsaWRlcy5sZW5ndGg7XG5cbiAgICAgICAgXy4kc2xpZGVzLmVhY2goZnVuY3Rpb24oaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICQoZWxlbWVudClcbiAgICAgICAgICAgICAgICAuYXR0cignZGF0YS1zbGljay1pbmRleCcsIGluZGV4KVxuICAgICAgICAgICAgICAgIC5kYXRhKCdvcmlnaW5hbFN0eWxpbmcnLCAkKGVsZW1lbnQpLmF0dHIoJ3N0eWxlJykgfHwgJycpO1xuICAgICAgICB9KTtcblxuICAgICAgICBfLiRzbGlkZXIuYWRkQ2xhc3MoJ3NsaWNrLXNsaWRlcicpO1xuXG4gICAgICAgIF8uJHNsaWRlVHJhY2sgPSAoXy5zbGlkZUNvdW50ID09PSAwKSA/XG4gICAgICAgICAgICAkKCc8ZGl2IGNsYXNzPVwic2xpY2stdHJhY2tcIi8+JykuYXBwZW5kVG8oXy4kc2xpZGVyKSA6XG4gICAgICAgICAgICBfLiRzbGlkZXMud3JhcEFsbCgnPGRpdiBjbGFzcz1cInNsaWNrLXRyYWNrXCIvPicpLnBhcmVudCgpO1xuXG4gICAgICAgIF8uJGxpc3QgPSBfLiRzbGlkZVRyYWNrLndyYXAoXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cInNsaWNrLWxpc3RcIi8+JykucGFyZW50KCk7XG4gICAgICAgIF8uJHNsaWRlVHJhY2suY3NzKCdvcGFjaXR5JywgMCk7XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5jZW50ZXJNb2RlID09PSB0cnVlIHx8IF8ub3B0aW9ucy5zd2lwZVRvU2xpZGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgIF8ub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCA9IDE7XG4gICAgICAgIH1cblxuICAgICAgICAkKCdpbWdbZGF0YS1sYXp5XScsIF8uJHNsaWRlcikubm90KCdbc3JjXScpLmFkZENsYXNzKCdzbGljay1sb2FkaW5nJyk7XG5cbiAgICAgICAgXy5zZXR1cEluZmluaXRlKCk7XG5cbiAgICAgICAgXy5idWlsZEFycm93cygpO1xuXG4gICAgICAgIF8uYnVpbGREb3RzKCk7XG5cbiAgICAgICAgXy51cGRhdGVEb3RzKCk7XG5cblxuICAgICAgICBfLnNldFNsaWRlQ2xhc3Nlcyh0eXBlb2YgXy5jdXJyZW50U2xpZGUgPT09ICdudW1iZXInID8gXy5jdXJyZW50U2xpZGUgOiAwKTtcblxuICAgICAgICBpZiAoXy5vcHRpb25zLmRyYWdnYWJsZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgXy4kbGlzdC5hZGRDbGFzcygnZHJhZ2dhYmxlJyk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuYnVpbGRSb3dzID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzLCBhLCBiLCBjLCBuZXdTbGlkZXMsIG51bU9mU2xpZGVzLCBvcmlnaW5hbFNsaWRlcyxzbGlkZXNQZXJTZWN0aW9uO1xuXG4gICAgICAgIG5ld1NsaWRlcyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICAgICAgb3JpZ2luYWxTbGlkZXMgPSBfLiRzbGlkZXIuY2hpbGRyZW4oKTtcblxuICAgICAgICBpZihfLm9wdGlvbnMucm93cyA+IDApIHtcblxuICAgICAgICAgICAgc2xpZGVzUGVyU2VjdGlvbiA9IF8ub3B0aW9ucy5zbGlkZXNQZXJSb3cgKiBfLm9wdGlvbnMucm93cztcbiAgICAgICAgICAgIG51bU9mU2xpZGVzID0gTWF0aC5jZWlsKFxuICAgICAgICAgICAgICAgIG9yaWdpbmFsU2xpZGVzLmxlbmd0aCAvIHNsaWRlc1BlclNlY3Rpb25cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGZvcihhID0gMDsgYSA8IG51bU9mU2xpZGVzOyBhKyspe1xuICAgICAgICAgICAgICAgIHZhciBzbGlkZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgIGZvcihiID0gMDsgYiA8IF8ub3B0aW9ucy5yb3dzOyBiKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICAgICBmb3IoYyA9IDA7IGMgPCBfLm9wdGlvbnMuc2xpZGVzUGVyUm93OyBjKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSAoYSAqIHNsaWRlc1BlclNlY3Rpb24gKyAoKGIgKiBfLm9wdGlvbnMuc2xpZGVzUGVyUm93KSArIGMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcmlnaW5hbFNsaWRlcy5nZXQodGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdy5hcHBlbmRDaGlsZChvcmlnaW5hbFNsaWRlcy5nZXQodGFyZ2V0KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2xpZGUuYXBwZW5kQ2hpbGQocm93KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV3U2xpZGVzLmFwcGVuZENoaWxkKHNsaWRlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgXy4kc2xpZGVyLmVtcHR5KCkuYXBwZW5kKG5ld1NsaWRlcyk7XG4gICAgICAgICAgICBfLiRzbGlkZXIuY2hpbGRyZW4oKS5jaGlsZHJlbigpLmNoaWxkcmVuKClcbiAgICAgICAgICAgICAgICAuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgJ3dpZHRoJzooMTAwIC8gXy5vcHRpb25zLnNsaWRlc1BlclJvdykgKyAnJScsXG4gICAgICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaydcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmNoZWNrUmVzcG9uc2l2ZSA9IGZ1bmN0aW9uKGluaXRpYWwsIGZvcmNlVXBkYXRlKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzLFxuICAgICAgICAgICAgYnJlYWtwb2ludCwgdGFyZ2V0QnJlYWtwb2ludCwgcmVzcG9uZFRvV2lkdGgsIHRyaWdnZXJCcmVha3BvaW50ID0gZmFsc2U7XG4gICAgICAgIHZhciBzbGlkZXJXaWR0aCA9IF8uJHNsaWRlci53aWR0aCgpO1xuICAgICAgICB2YXIgd2luZG93V2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aCB8fCAkKHdpbmRvdykud2lkdGgoKTtcblxuICAgICAgICBpZiAoXy5yZXNwb25kVG8gPT09ICd3aW5kb3cnKSB7XG4gICAgICAgICAgICByZXNwb25kVG9XaWR0aCA9IHdpbmRvd1dpZHRoO1xuICAgICAgICB9IGVsc2UgaWYgKF8ucmVzcG9uZFRvID09PSAnc2xpZGVyJykge1xuICAgICAgICAgICAgcmVzcG9uZFRvV2lkdGggPSBzbGlkZXJXaWR0aDtcbiAgICAgICAgfSBlbHNlIGlmIChfLnJlc3BvbmRUbyA9PT0gJ21pbicpIHtcbiAgICAgICAgICAgIHJlc3BvbmRUb1dpZHRoID0gTWF0aC5taW4od2luZG93V2lkdGgsIHNsaWRlcldpZHRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggXy5vcHRpb25zLnJlc3BvbnNpdmUgJiZcbiAgICAgICAgICAgIF8ub3B0aW9ucy5yZXNwb25zaXZlLmxlbmd0aCAmJlxuICAgICAgICAgICAgXy5vcHRpb25zLnJlc3BvbnNpdmUgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgdGFyZ2V0QnJlYWtwb2ludCA9IG51bGw7XG5cbiAgICAgICAgICAgIGZvciAoYnJlYWtwb2ludCBpbiBfLmJyZWFrcG9pbnRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKF8uYnJlYWtwb2ludHMuaGFzT3duUHJvcGVydHkoYnJlYWtwb2ludCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF8ub3JpZ2luYWxTZXR0aW5ncy5tb2JpbGVGaXJzdCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25kVG9XaWR0aCA8IF8uYnJlYWtwb2ludHNbYnJlYWtwb2ludF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRCcmVha3BvaW50ID0gXy5icmVha3BvaW50c1ticmVha3BvaW50XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25kVG9XaWR0aCA+IF8uYnJlYWtwb2ludHNbYnJlYWtwb2ludF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRCcmVha3BvaW50ID0gXy5icmVha3BvaW50c1ticmVha3BvaW50XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRhcmdldEJyZWFrcG9pbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoXy5hY3RpdmVCcmVha3BvaW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXRCcmVha3BvaW50ICE9PSBfLmFjdGl2ZUJyZWFrcG9pbnQgfHwgZm9yY2VVcGRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF8uYWN0aXZlQnJlYWtwb2ludCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0QnJlYWtwb2ludDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfLmJyZWFrcG9pbnRTZXR0aW5nc1t0YXJnZXRCcmVha3BvaW50XSA9PT0gJ3Vuc2xpY2snKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXy51bnNsaWNrKHRhcmdldEJyZWFrcG9pbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgXy5vcmlnaW5hbFNldHRpbmdzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmJyZWFrcG9pbnRTZXR0aW5nc1tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldEJyZWFrcG9pbnRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5pdGlhbCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmN1cnJlbnRTbGlkZSA9IF8ub3B0aW9ucy5pbml0aWFsU2xpZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8ucmVmcmVzaChpbml0aWFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyaWdnZXJCcmVha3BvaW50ID0gdGFyZ2V0QnJlYWtwb2ludDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIF8uYWN0aXZlQnJlYWtwb2ludCA9IHRhcmdldEJyZWFrcG9pbnQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfLmJyZWFrcG9pbnRTZXR0aW5nc1t0YXJnZXRCcmVha3BvaW50XSA9PT0gJ3Vuc2xpY2snKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfLnVuc2xpY2sodGFyZ2V0QnJlYWtwb2ludCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgXy5vcmlnaW5hbFNldHRpbmdzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uYnJlYWtwb2ludFNldHRpbmdzW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRCcmVha3BvaW50XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5pdGlhbCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uY3VycmVudFNsaWRlID0gXy5vcHRpb25zLmluaXRpYWxTbGlkZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIF8ucmVmcmVzaChpbml0aWFsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyQnJlYWtwb2ludCA9IHRhcmdldEJyZWFrcG9pbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoXy5hY3RpdmVCcmVha3BvaW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIF8uYWN0aXZlQnJlYWtwb2ludCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIF8ub3B0aW9ucyA9IF8ub3JpZ2luYWxTZXR0aW5ncztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluaXRpYWwgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF8uY3VycmVudFNsaWRlID0gXy5vcHRpb25zLmluaXRpYWxTbGlkZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBfLnJlZnJlc2goaW5pdGlhbCk7XG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXJCcmVha3BvaW50ID0gdGFyZ2V0QnJlYWtwb2ludDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIG9ubHkgdHJpZ2dlciBicmVha3BvaW50cyBkdXJpbmcgYW4gYWN0dWFsIGJyZWFrLiBub3Qgb24gaW5pdGlhbGl6ZS5cbiAgICAgICAgICAgIGlmKCAhaW5pdGlhbCAmJiB0cmlnZ2VyQnJlYWtwb2ludCAhPT0gZmFsc2UgKSB7XG4gICAgICAgICAgICAgICAgXy4kc2xpZGVyLnRyaWdnZXIoJ2JyZWFrcG9pbnQnLCBbXywgdHJpZ2dlckJyZWFrcG9pbnRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5jaGFuZ2VTbGlkZSA9IGZ1bmN0aW9uKGV2ZW50LCBkb250QW5pbWF0ZSkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcyxcbiAgICAgICAgICAgICR0YXJnZXQgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpLFxuICAgICAgICAgICAgaW5kZXhPZmZzZXQsIHNsaWRlT2Zmc2V0LCB1bmV2ZW5PZmZzZXQ7XG5cbiAgICAgICAgLy8gSWYgdGFyZ2V0IGlzIGEgbGluaywgcHJldmVudCBkZWZhdWx0IGFjdGlvbi5cbiAgICAgICAgaWYoJHRhcmdldC5pcygnYScpKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGFyZ2V0IGlzIG5vdCB0aGUgPGxpPiBlbGVtZW50IChpZTogYSBjaGlsZCksIGZpbmQgdGhlIDxsaT4uXG4gICAgICAgIGlmKCEkdGFyZ2V0LmlzKCdsaScpKSB7XG4gICAgICAgICAgICAkdGFyZ2V0ID0gJHRhcmdldC5jbG9zZXN0KCdsaScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdW5ldmVuT2Zmc2V0ID0gKF8uc2xpZGVDb3VudCAlIF8ub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCAhPT0gMCk7XG4gICAgICAgIGluZGV4T2Zmc2V0ID0gdW5ldmVuT2Zmc2V0ID8gMCA6IChfLnNsaWRlQ291bnQgLSBfLmN1cnJlbnRTbGlkZSkgJSBfLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw7XG5cbiAgICAgICAgc3dpdGNoIChldmVudC5kYXRhLm1lc3NhZ2UpIHtcblxuICAgICAgICAgICAgY2FzZSAncHJldmlvdXMnOlxuICAgICAgICAgICAgICAgIHNsaWRlT2Zmc2V0ID0gaW5kZXhPZmZzZXQgPT09IDAgPyBfLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwgOiBfLm9wdGlvbnMuc2xpZGVzVG9TaG93IC0gaW5kZXhPZmZzZXQ7XG4gICAgICAgICAgICAgICAgaWYgKF8uc2xpZGVDb3VudCA+IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cpIHtcbiAgICAgICAgICAgICAgICAgICAgXy5zbGlkZUhhbmRsZXIoXy5jdXJyZW50U2xpZGUgLSBzbGlkZU9mZnNldCwgZmFsc2UsIGRvbnRBbmltYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ25leHQnOlxuICAgICAgICAgICAgICAgIHNsaWRlT2Zmc2V0ID0gaW5kZXhPZmZzZXQgPT09IDAgPyBfLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwgOiBpbmRleE9mZnNldDtcbiAgICAgICAgICAgICAgICBpZiAoXy5zbGlkZUNvdW50ID4gXy5vcHRpb25zLnNsaWRlc1RvU2hvdykge1xuICAgICAgICAgICAgICAgICAgICBfLnNsaWRlSGFuZGxlcihfLmN1cnJlbnRTbGlkZSArIHNsaWRlT2Zmc2V0LCBmYWxzZSwgZG9udEFuaW1hdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnaW5kZXgnOlxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGV2ZW50LmRhdGEuaW5kZXggPT09IDAgPyAwIDpcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuZGF0YS5pbmRleCB8fCAkdGFyZ2V0LmluZGV4KCkgKiBfLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw7XG5cbiAgICAgICAgICAgICAgICBfLnNsaWRlSGFuZGxlcihfLmNoZWNrTmF2aWdhYmxlKGluZGV4KSwgZmFsc2UsIGRvbnRBbmltYXRlKTtcbiAgICAgICAgICAgICAgICAkdGFyZ2V0LmNoaWxkcmVuKCkudHJpZ2dlcignZm9jdXMnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuY2hlY2tOYXZpZ2FibGUgPSBmdW5jdGlvbihpbmRleCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcyxcbiAgICAgICAgICAgIG5hdmlnYWJsZXMsIHByZXZOYXZpZ2FibGU7XG5cbiAgICAgICAgbmF2aWdhYmxlcyA9IF8uZ2V0TmF2aWdhYmxlSW5kZXhlcygpO1xuICAgICAgICBwcmV2TmF2aWdhYmxlID0gMDtcbiAgICAgICAgaWYgKGluZGV4ID4gbmF2aWdhYmxlc1tuYXZpZ2FibGVzLmxlbmd0aCAtIDFdKSB7XG4gICAgICAgICAgICBpbmRleCA9IG5hdmlnYWJsZXNbbmF2aWdhYmxlcy5sZW5ndGggLSAxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIG4gaW4gbmF2aWdhYmxlcykge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA8IG5hdmlnYWJsZXNbbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBwcmV2TmF2aWdhYmxlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJldk5hdmlnYWJsZSA9IG5hdmlnYWJsZXNbbl07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5jbGVhblVwRXZlbnRzID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuXG4gICAgICAgIGlmIChfLm9wdGlvbnMuZG90cyAmJiBfLiRkb3RzICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICQoJ2xpJywgXy4kZG90cylcbiAgICAgICAgICAgICAgICAub2ZmKCdjbGljay5zbGljaycsIF8uY2hhbmdlU2xpZGUpXG4gICAgICAgICAgICAgICAgLm9mZignbW91c2VlbnRlci5zbGljaycsICQucHJveHkoXy5pbnRlcnJ1cHQsIF8sIHRydWUpKVxuICAgICAgICAgICAgICAgIC5vZmYoJ21vdXNlbGVhdmUuc2xpY2snLCAkLnByb3h5KF8uaW50ZXJydXB0LCBfLCBmYWxzZSkpO1xuXG4gICAgICAgICAgICBpZiAoXy5vcHRpb25zLmFjY2Vzc2liaWxpdHkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBfLiRkb3RzLm9mZigna2V5ZG93bi5zbGljaycsIF8ua2V5SGFuZGxlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBfLiRzbGlkZXIub2ZmKCdmb2N1cy5zbGljayBibHVyLnNsaWNrJyk7XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5hcnJvd3MgPT09IHRydWUgJiYgXy5zbGlkZUNvdW50ID4gXy5vcHRpb25zLnNsaWRlc1RvU2hvdykge1xuICAgICAgICAgICAgXy4kcHJldkFycm93ICYmIF8uJHByZXZBcnJvdy5vZmYoJ2NsaWNrLnNsaWNrJywgXy5jaGFuZ2VTbGlkZSk7XG4gICAgICAgICAgICBfLiRuZXh0QXJyb3cgJiYgXy4kbmV4dEFycm93Lm9mZignY2xpY2suc2xpY2snLCBfLmNoYW5nZVNsaWRlKTtcblxuICAgICAgICAgICAgaWYgKF8ub3B0aW9ucy5hY2Nlc3NpYmlsaXR5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgXy4kcHJldkFycm93ICYmIF8uJHByZXZBcnJvdy5vZmYoJ2tleWRvd24uc2xpY2snLCBfLmtleUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIF8uJG5leHRBcnJvdyAmJiBfLiRuZXh0QXJyb3cub2ZmKCdrZXlkb3duLnNsaWNrJywgXy5rZXlIYW5kbGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIF8uJGxpc3Qub2ZmKCd0b3VjaHN0YXJ0LnNsaWNrIG1vdXNlZG93bi5zbGljaycsIF8uc3dpcGVIYW5kbGVyKTtcbiAgICAgICAgXy4kbGlzdC5vZmYoJ3RvdWNobW92ZS5zbGljayBtb3VzZW1vdmUuc2xpY2snLCBfLnN3aXBlSGFuZGxlcik7XG4gICAgICAgIF8uJGxpc3Qub2ZmKCd0b3VjaGVuZC5zbGljayBtb3VzZXVwLnNsaWNrJywgXy5zd2lwZUhhbmRsZXIpO1xuICAgICAgICBfLiRsaXN0Lm9mZigndG91Y2hjYW5jZWwuc2xpY2sgbW91c2VsZWF2ZS5zbGljaycsIF8uc3dpcGVIYW5kbGVyKTtcblxuICAgICAgICBfLiRsaXN0Lm9mZignY2xpY2suc2xpY2snLCBfLmNsaWNrSGFuZGxlcik7XG5cbiAgICAgICAgJChkb2N1bWVudCkub2ZmKF8udmlzaWJpbGl0eUNoYW5nZSwgXy52aXNpYmlsaXR5KTtcblxuICAgICAgICBfLmNsZWFuVXBTbGlkZUV2ZW50cygpO1xuXG4gICAgICAgIGlmIChfLm9wdGlvbnMuYWNjZXNzaWJpbGl0eSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgXy4kbGlzdC5vZmYoJ2tleWRvd24uc2xpY2snLCBfLmtleUhhbmRsZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5mb2N1c09uU2VsZWN0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAkKF8uJHNsaWRlVHJhY2spLmNoaWxkcmVuKCkub2ZmKCdjbGljay5zbGljaycsIF8uc2VsZWN0SGFuZGxlcik7XG4gICAgICAgIH1cblxuICAgICAgICAkKHdpbmRvdykub2ZmKCdvcmllbnRhdGlvbmNoYW5nZS5zbGljay5zbGljay0nICsgXy5pbnN0YW5jZVVpZCwgXy5vcmllbnRhdGlvbkNoYW5nZSk7XG5cbiAgICAgICAgJCh3aW5kb3cpLm9mZigncmVzaXplLnNsaWNrLnNsaWNrLScgKyBfLmluc3RhbmNlVWlkLCBfLnJlc2l6ZSk7XG5cbiAgICAgICAgJCgnW2RyYWdnYWJsZSE9dHJ1ZV0nLCBfLiRzbGlkZVRyYWNrKS5vZmYoJ2RyYWdzdGFydCcsIF8ucHJldmVudERlZmF1bHQpO1xuXG4gICAgICAgICQod2luZG93KS5vZmYoJ2xvYWQuc2xpY2suc2xpY2stJyArIF8uaW5zdGFuY2VVaWQsIF8uc2V0UG9zaXRpb24pO1xuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5jbGVhblVwU2xpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgXy4kbGlzdC5vZmYoJ21vdXNlZW50ZXIuc2xpY2snLCAkLnByb3h5KF8uaW50ZXJydXB0LCBfLCB0cnVlKSk7XG4gICAgICAgIF8uJGxpc3Qub2ZmKCdtb3VzZWxlYXZlLnNsaWNrJywgJC5wcm94eShfLmludGVycnVwdCwgXywgZmFsc2UpKTtcblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuY2xlYW5VcFJvd3MgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXMsIG9yaWdpbmFsU2xpZGVzO1xuXG4gICAgICAgIGlmKF8ub3B0aW9ucy5yb3dzID4gMCkge1xuICAgICAgICAgICAgb3JpZ2luYWxTbGlkZXMgPSBfLiRzbGlkZXMuY2hpbGRyZW4oKS5jaGlsZHJlbigpO1xuICAgICAgICAgICAgb3JpZ2luYWxTbGlkZXMucmVtb3ZlQXR0cignc3R5bGUnKTtcbiAgICAgICAgICAgIF8uJHNsaWRlci5lbXB0eSgpLmFwcGVuZChvcmlnaW5hbFNsaWRlcyk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKF8uc2hvdWxkQ2xpY2sgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24ocmVmcmVzaCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBfLmF1dG9QbGF5Q2xlYXIoKTtcblxuICAgICAgICBfLnRvdWNoT2JqZWN0ID0ge307XG5cbiAgICAgICAgXy5jbGVhblVwRXZlbnRzKCk7XG5cbiAgICAgICAgJCgnLnNsaWNrLWNsb25lZCcsIF8uJHNsaWRlcikuZGV0YWNoKCk7XG5cbiAgICAgICAgaWYgKF8uJGRvdHMpIHtcbiAgICAgICAgICAgIF8uJGRvdHMucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIF8uJHByZXZBcnJvdyAmJiBfLiRwcmV2QXJyb3cubGVuZ3RoICkge1xuXG4gICAgICAgICAgICBfLiRwcmV2QXJyb3dcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3NsaWNrLWRpc2FibGVkIHNsaWNrLWFycm93IHNsaWNrLWhpZGRlbicpXG4gICAgICAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2FyaWEtaGlkZGVuIGFyaWEtZGlzYWJsZWQgdGFiaW5kZXgnKVxuICAgICAgICAgICAgICAgIC5jc3MoJ2Rpc3BsYXknLCcnKTtcblxuICAgICAgICAgICAgaWYgKCBfLmh0bWxFeHByLnRlc3QoIF8ub3B0aW9ucy5wcmV2QXJyb3cgKSkge1xuICAgICAgICAgICAgICAgIF8uJHByZXZBcnJvdy5yZW1vdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggXy4kbmV4dEFycm93ICYmIF8uJG5leHRBcnJvdy5sZW5ndGggKSB7XG5cbiAgICAgICAgICAgIF8uJG5leHRBcnJvd1xuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnc2xpY2stZGlzYWJsZWQgc2xpY2stYXJyb3cgc2xpY2staGlkZGVuJylcbiAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cignYXJpYS1oaWRkZW4gYXJpYS1kaXNhYmxlZCB0YWJpbmRleCcpXG4gICAgICAgICAgICAgICAgLmNzcygnZGlzcGxheScsJycpO1xuXG4gICAgICAgICAgICBpZiAoIF8uaHRtbEV4cHIudGVzdCggXy5vcHRpb25zLm5leHRBcnJvdyApKSB7XG4gICAgICAgICAgICAgICAgXy4kbmV4dEFycm93LnJlbW92ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICBpZiAoXy4kc2xpZGVzKSB7XG5cbiAgICAgICAgICAgIF8uJHNsaWRlc1xuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnc2xpY2stc2xpZGUgc2xpY2stYWN0aXZlIHNsaWNrLWNlbnRlciBzbGljay12aXNpYmxlIHNsaWNrLWN1cnJlbnQnKVxuICAgICAgICAgICAgICAgIC5yZW1vdmVBdHRyKCdhcmlhLWhpZGRlbicpXG4gICAgICAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2RhdGEtc2xpY2staW5kZXgnKVxuICAgICAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYXR0cignc3R5bGUnLCAkKHRoaXMpLmRhdGEoJ29yaWdpbmFsU3R5bGluZycpKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgXy4kc2xpZGVUcmFjay5jaGlsZHJlbih0aGlzLm9wdGlvbnMuc2xpZGUpLmRldGFjaCgpO1xuXG4gICAgICAgICAgICBfLiRzbGlkZVRyYWNrLmRldGFjaCgpO1xuXG4gICAgICAgICAgICBfLiRsaXN0LmRldGFjaCgpO1xuXG4gICAgICAgICAgICBfLiRzbGlkZXIuYXBwZW5kKF8uJHNsaWRlcyk7XG4gICAgICAgIH1cblxuICAgICAgICBfLmNsZWFuVXBSb3dzKCk7XG5cbiAgICAgICAgXy4kc2xpZGVyLnJlbW92ZUNsYXNzKCdzbGljay1zbGlkZXInKTtcbiAgICAgICAgXy4kc2xpZGVyLnJlbW92ZUNsYXNzKCdzbGljay1pbml0aWFsaXplZCcpO1xuICAgICAgICBfLiRzbGlkZXIucmVtb3ZlQ2xhc3MoJ3NsaWNrLWRvdHRlZCcpO1xuXG4gICAgICAgIF8udW5zbGlja2VkID0gdHJ1ZTtcblxuICAgICAgICBpZighcmVmcmVzaCkge1xuICAgICAgICAgICAgXy4kc2xpZGVyLnRyaWdnZXIoJ2Rlc3Ryb3knLCBbX10pO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmRpc2FibGVUcmFuc2l0aW9uID0gZnVuY3Rpb24oc2xpZGUpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXMsXG4gICAgICAgICAgICB0cmFuc2l0aW9uID0ge307XG5cbiAgICAgICAgdHJhbnNpdGlvbltfLnRyYW5zaXRpb25UeXBlXSA9ICcnO1xuXG4gICAgICAgIGlmIChfLm9wdGlvbnMuZmFkZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIF8uJHNsaWRlVHJhY2suY3NzKHRyYW5zaXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgXy4kc2xpZGVzLmVxKHNsaWRlKS5jc3ModHJhbnNpdGlvbik7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuZmFkZVNsaWRlID0gZnVuY3Rpb24oc2xpZGVJbmRleCwgY2FsbGJhY2spIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKF8uY3NzVHJhbnNpdGlvbnMgPT09IGZhbHNlKSB7XG5cbiAgICAgICAgICAgIF8uJHNsaWRlcy5lcShzbGlkZUluZGV4KS5jc3Moe1xuICAgICAgICAgICAgICAgIHpJbmRleDogXy5vcHRpb25zLnpJbmRleFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIF8uJHNsaWRlcy5lcShzbGlkZUluZGV4KS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAxXG4gICAgICAgICAgICB9LCBfLm9wdGlvbnMuc3BlZWQsIF8ub3B0aW9ucy5lYXNpbmcsIGNhbGxiYWNrKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBfLmFwcGx5VHJhbnNpdGlvbihzbGlkZUluZGV4KTtcblxuICAgICAgICAgICAgXy4kc2xpZGVzLmVxKHNsaWRlSW5kZXgpLmNzcyh7XG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICAgICB6SW5kZXg6IF8ub3B0aW9ucy56SW5kZXhcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgIF8uZGlzYWJsZVRyYW5zaXRpb24oc2xpZGVJbmRleCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbCgpO1xuICAgICAgICAgICAgICAgIH0sIF8ub3B0aW9ucy5zcGVlZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5mYWRlU2xpZGVPdXQgPSBmdW5jdGlvbihzbGlkZUluZGV4KSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuXG4gICAgICAgIGlmIChfLmNzc1RyYW5zaXRpb25zID09PSBmYWxzZSkge1xuXG4gICAgICAgICAgICBfLiRzbGlkZXMuZXEoc2xpZGVJbmRleCkuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgICAgICAgICB6SW5kZXg6IF8ub3B0aW9ucy56SW5kZXggLSAyXG4gICAgICAgICAgICB9LCBfLm9wdGlvbnMuc3BlZWQsIF8ub3B0aW9ucy5lYXNpbmcpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIF8uYXBwbHlUcmFuc2l0aW9uKHNsaWRlSW5kZXgpO1xuXG4gICAgICAgICAgICBfLiRzbGlkZXMuZXEoc2xpZGVJbmRleCkuY3NzKHtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgICAgIHpJbmRleDogXy5vcHRpb25zLnpJbmRleCAtIDJcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuZmlsdGVyU2xpZGVzID0gU2xpY2sucHJvdG90eXBlLnNsaWNrRmlsdGVyID0gZnVuY3Rpb24oZmlsdGVyKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuXG4gICAgICAgIGlmIChmaWx0ZXIgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgXy4kc2xpZGVzQ2FjaGUgPSBfLiRzbGlkZXM7XG5cbiAgICAgICAgICAgIF8udW5sb2FkKCk7XG5cbiAgICAgICAgICAgIF8uJHNsaWRlVHJhY2suY2hpbGRyZW4odGhpcy5vcHRpb25zLnNsaWRlKS5kZXRhY2goKTtcblxuICAgICAgICAgICAgXy4kc2xpZGVzQ2FjaGUuZmlsdGVyKGZpbHRlcikuYXBwZW5kVG8oXy4kc2xpZGVUcmFjayk7XG5cbiAgICAgICAgICAgIF8ucmVpbml0KCk7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5mb2N1c0hhbmRsZXIgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgXy4kc2xpZGVyXG4gICAgICAgICAgICAub2ZmKCdmb2N1cy5zbGljayBibHVyLnNsaWNrJylcbiAgICAgICAgICAgIC5vbignZm9jdXMuc2xpY2sgYmx1ci5zbGljaycsICcqJywgZnVuY3Rpb24oZXZlbnQpIHtcblxuICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB2YXIgJHNmID0gJCh0aGlzKTtcblxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgIGlmKCBfLm9wdGlvbnMucGF1c2VPbkZvY3VzICkge1xuICAgICAgICAgICAgICAgICAgICBfLmZvY3Vzc2VkID0gJHNmLmlzKCc6Zm9jdXMnKTtcbiAgICAgICAgICAgICAgICAgICAgXy5hdXRvUGxheSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSwgMCk7XG5cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5nZXRDdXJyZW50ID0gU2xpY2sucHJvdG90eXBlLnNsaWNrQ3VycmVudFNsaWRlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuICAgICAgICByZXR1cm4gXy5jdXJyZW50U2xpZGU7XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmdldERvdENvdW50ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuXG4gICAgICAgIHZhciBicmVha1BvaW50ID0gMDtcbiAgICAgICAgdmFyIGNvdW50ZXIgPSAwO1xuICAgICAgICB2YXIgcGFnZXJRdHkgPSAwO1xuXG4gICAgICAgIGlmIChfLm9wdGlvbnMuaW5maW5pdGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGlmIChfLnNsaWRlQ291bnQgPD0gXy5vcHRpb25zLnNsaWRlc1RvU2hvdykge1xuICAgICAgICAgICAgICAgICArK3BhZ2VyUXR5O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aGlsZSAoYnJlYWtQb2ludCA8IF8uc2xpZGVDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICArK3BhZ2VyUXR5O1xuICAgICAgICAgICAgICAgICAgICBicmVha1BvaW50ID0gY291bnRlciArIF8ub3B0aW9ucy5zbGlkZXNUb1Njcm9sbDtcbiAgICAgICAgICAgICAgICAgICAgY291bnRlciArPSBfLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwgPD0gXy5vcHRpb25zLnNsaWRlc1RvU2hvdyA/IF8ub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCA6IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3c7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKF8ub3B0aW9ucy5jZW50ZXJNb2RlID09PSB0cnVlKSB7XG4gICAgICAgICAgICBwYWdlclF0eSA9IF8uc2xpZGVDb3VudDtcbiAgICAgICAgfSBlbHNlIGlmKCFfLm9wdGlvbnMuYXNOYXZGb3IpIHtcbiAgICAgICAgICAgIHBhZ2VyUXR5ID0gMSArIE1hdGguY2VpbCgoXy5zbGlkZUNvdW50IC0gXy5vcHRpb25zLnNsaWRlc1RvU2hvdykgLyBfLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwpO1xuICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICB3aGlsZSAoYnJlYWtQb2ludCA8IF8uc2xpZGVDb3VudCkge1xuICAgICAgICAgICAgICAgICsrcGFnZXJRdHk7XG4gICAgICAgICAgICAgICAgYnJlYWtQb2ludCA9IGNvdW50ZXIgKyBfLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw7XG4gICAgICAgICAgICAgICAgY291bnRlciArPSBfLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwgPD0gXy5vcHRpb25zLnNsaWRlc1RvU2hvdyA/IF8ub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCA6IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3c7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGFnZXJRdHkgLSAxO1xuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5nZXRMZWZ0ID0gZnVuY3Rpb24oc2xpZGVJbmRleCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcyxcbiAgICAgICAgICAgIHRhcmdldExlZnQsXG4gICAgICAgICAgICB2ZXJ0aWNhbEhlaWdodCxcbiAgICAgICAgICAgIHZlcnRpY2FsT2Zmc2V0ID0gMCxcbiAgICAgICAgICAgIHRhcmdldFNsaWRlLFxuICAgICAgICAgICAgY29lZjtcblxuICAgICAgICBfLnNsaWRlT2Zmc2V0ID0gMDtcbiAgICAgICAgdmVydGljYWxIZWlnaHQgPSBfLiRzbGlkZXMuZmlyc3QoKS5vdXRlckhlaWdodCh0cnVlKTtcblxuICAgICAgICBpZiAoXy5vcHRpb25zLmluZmluaXRlID09PSB0cnVlKSB7XG4gICAgICAgICAgICBpZiAoXy5zbGlkZUNvdW50ID4gXy5vcHRpb25zLnNsaWRlc1RvU2hvdykge1xuICAgICAgICAgICAgICAgIF8uc2xpZGVPZmZzZXQgPSAoXy5zbGlkZVdpZHRoICogXy5vcHRpb25zLnNsaWRlc1RvU2hvdykgKiAtMTtcbiAgICAgICAgICAgICAgICBjb2VmID0gLTFcblxuICAgICAgICAgICAgICAgIGlmIChfLm9wdGlvbnMudmVydGljYWwgPT09IHRydWUgJiYgXy5vcHRpb25zLmNlbnRlck1vZGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZWYgPSAtMS41O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZWYgPSAtMlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZlcnRpY2FsT2Zmc2V0ID0gKHZlcnRpY2FsSGVpZ2h0ICogXy5vcHRpb25zLnNsaWRlc1RvU2hvdykgKiBjb2VmO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKF8uc2xpZGVDb3VudCAlIF8ub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChzbGlkZUluZGV4ICsgXy5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsID4gXy5zbGlkZUNvdW50ICYmIF8uc2xpZGVDb3VudCA+IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNsaWRlSW5kZXggPiBfLnNsaWRlQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF8uc2xpZGVPZmZzZXQgPSAoKF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cgLSAoc2xpZGVJbmRleCAtIF8uc2xpZGVDb3VudCkpICogXy5zbGlkZVdpZHRoKSAqIC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmVydGljYWxPZmZzZXQgPSAoKF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cgLSAoc2xpZGVJbmRleCAtIF8uc2xpZGVDb3VudCkpICogdmVydGljYWxIZWlnaHQpICogLTE7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfLnNsaWRlT2Zmc2V0ID0gKChfLnNsaWRlQ291bnQgJSBfLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwpICogXy5zbGlkZVdpZHRoKSAqIC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmVydGljYWxPZmZzZXQgPSAoKF8uc2xpZGVDb3VudCAlIF8ub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCkgKiB2ZXJ0aWNhbEhlaWdodCkgKiAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzbGlkZUluZGV4ICsgXy5vcHRpb25zLnNsaWRlc1RvU2hvdyA+IF8uc2xpZGVDb3VudCkge1xuICAgICAgICAgICAgICAgIF8uc2xpZGVPZmZzZXQgPSAoKHNsaWRlSW5kZXggKyBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KSAtIF8uc2xpZGVDb3VudCkgKiBfLnNsaWRlV2lkdGg7XG4gICAgICAgICAgICAgICAgdmVydGljYWxPZmZzZXQgPSAoKHNsaWRlSW5kZXggKyBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KSAtIF8uc2xpZGVDb3VudCkgKiB2ZXJ0aWNhbEhlaWdodDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfLnNsaWRlQ291bnQgPD0gXy5vcHRpb25zLnNsaWRlc1RvU2hvdykge1xuICAgICAgICAgICAgXy5zbGlkZU9mZnNldCA9IDA7XG4gICAgICAgICAgICB2ZXJ0aWNhbE9mZnNldCA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5vcHRpb25zLmNlbnRlck1vZGUgPT09IHRydWUgJiYgXy5zbGlkZUNvdW50IDw9IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cpIHtcbiAgICAgICAgICAgIF8uc2xpZGVPZmZzZXQgPSAoKF8uc2xpZGVXaWR0aCAqIE1hdGguZmxvb3IoXy5vcHRpb25zLnNsaWRlc1RvU2hvdykpIC8gMikgLSAoKF8uc2xpZGVXaWR0aCAqIF8uc2xpZGVDb3VudCkgLyAyKTtcbiAgICAgICAgfSBlbHNlIGlmIChfLm9wdGlvbnMuY2VudGVyTW9kZSA9PT0gdHJ1ZSAmJiBfLm9wdGlvbnMuaW5maW5pdGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgIF8uc2xpZGVPZmZzZXQgKz0gXy5zbGlkZVdpZHRoICogTWF0aC5mbG9vcihfLm9wdGlvbnMuc2xpZGVzVG9TaG93IC8gMikgLSBfLnNsaWRlV2lkdGg7XG4gICAgICAgIH0gZWxzZSBpZiAoXy5vcHRpb25zLmNlbnRlck1vZGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgIF8uc2xpZGVPZmZzZXQgPSAwO1xuICAgICAgICAgICAgXy5zbGlkZU9mZnNldCArPSBfLnNsaWRlV2lkdGggKiBNYXRoLmZsb29yKF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cgLyAyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfLm9wdGlvbnMudmVydGljYWwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0YXJnZXRMZWZ0ID0gKChzbGlkZUluZGV4ICogXy5zbGlkZVdpZHRoKSAqIC0xKSArIF8uc2xpZGVPZmZzZXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0YXJnZXRMZWZ0ID0gKChzbGlkZUluZGV4ICogdmVydGljYWxIZWlnaHQpICogLTEpICsgdmVydGljYWxPZmZzZXQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5vcHRpb25zLnZhcmlhYmxlV2lkdGggPT09IHRydWUpIHtcblxuICAgICAgICAgICAgaWYgKF8uc2xpZGVDb3VudCA8PSBfLm9wdGlvbnMuc2xpZGVzVG9TaG93IHx8IF8ub3B0aW9ucy5pbmZpbml0ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRTbGlkZSA9IF8uJHNsaWRlVHJhY2suY2hpbGRyZW4oJy5zbGljay1zbGlkZScpLmVxKHNsaWRlSW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRTbGlkZSA9IF8uJHNsaWRlVHJhY2suY2hpbGRyZW4oJy5zbGljay1zbGlkZScpLmVxKHNsaWRlSW5kZXggKyBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKF8ub3B0aW9ucy5ydGwgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0U2xpZGVbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0TGVmdCA9IChfLiRzbGlkZVRyYWNrLndpZHRoKCkgLSB0YXJnZXRTbGlkZVswXS5vZmZzZXRMZWZ0IC0gdGFyZ2V0U2xpZGUud2lkdGgoKSkgKiAtMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRMZWZ0ID0gIDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRMZWZ0ID0gdGFyZ2V0U2xpZGVbMF0gPyB0YXJnZXRTbGlkZVswXS5vZmZzZXRMZWZ0ICogLTEgOiAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXy5vcHRpb25zLmNlbnRlck1vZGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoXy5zbGlkZUNvdW50IDw9IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cgfHwgXy5vcHRpb25zLmluZmluaXRlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRTbGlkZSA9IF8uJHNsaWRlVHJhY2suY2hpbGRyZW4oJy5zbGljay1zbGlkZScpLmVxKHNsaWRlSW5kZXgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFNsaWRlID0gXy4kc2xpZGVUcmFjay5jaGlsZHJlbignLnNsaWNrLXNsaWRlJykuZXEoc2xpZGVJbmRleCArIF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cgKyAxKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoXy5vcHRpb25zLnJ0bCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0U2xpZGVbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldExlZnQgPSAoXy4kc2xpZGVUcmFjay53aWR0aCgpIC0gdGFyZ2V0U2xpZGVbMF0ub2Zmc2V0TGVmdCAtIHRhcmdldFNsaWRlLndpZHRoKCkpICogLTE7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRMZWZ0ID0gIDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXRMZWZ0ID0gdGFyZ2V0U2xpZGVbMF0gPyB0YXJnZXRTbGlkZVswXS5vZmZzZXRMZWZ0ICogLTEgOiAwO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRhcmdldExlZnQgKz0gKF8uJGxpc3Qud2lkdGgoKSAtIHRhcmdldFNsaWRlLm91dGVyV2lkdGgoKSkgLyAyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldExlZnQ7XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmdldE9wdGlvbiA9IFNsaWNrLnByb3RvdHlwZS5zbGlja0dldE9wdGlvbiA9IGZ1bmN0aW9uKG9wdGlvbikge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICByZXR1cm4gXy5vcHRpb25zW29wdGlvbl07XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmdldE5hdmlnYWJsZUluZGV4ZXMgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXMsXG4gICAgICAgICAgICBicmVha1BvaW50ID0gMCxcbiAgICAgICAgICAgIGNvdW50ZXIgPSAwLFxuICAgICAgICAgICAgaW5kZXhlcyA9IFtdLFxuICAgICAgICAgICAgbWF4O1xuXG4gICAgICAgIGlmIChfLm9wdGlvbnMuaW5maW5pdGUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBtYXggPSBfLnNsaWRlQ291bnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBicmVha1BvaW50ID0gXy5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsICogLTE7XG4gICAgICAgICAgICBjb3VudGVyID0gXy5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsICogLTE7XG4gICAgICAgICAgICBtYXggPSBfLnNsaWRlQ291bnQgKiAyO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKGJyZWFrUG9pbnQgPCBtYXgpIHtcbiAgICAgICAgICAgIGluZGV4ZXMucHVzaChicmVha1BvaW50KTtcbiAgICAgICAgICAgIGJyZWFrUG9pbnQgPSBjb3VudGVyICsgXy5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsO1xuICAgICAgICAgICAgY291bnRlciArPSBfLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwgPD0gXy5vcHRpb25zLnNsaWRlc1RvU2hvdyA/IF8ub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCA6IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3c7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW5kZXhlcztcblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuZ2V0U2xpY2sgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICByZXR1cm4gdGhpcztcblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuZ2V0U2xpZGVDb3VudCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcyxcbiAgICAgICAgICAgIHNsaWRlc1RyYXZlcnNlZCwgc3dpcGVkU2xpZGUsIGNlbnRlck9mZnNldDtcblxuICAgICAgICBjZW50ZXJPZmZzZXQgPSBfLm9wdGlvbnMuY2VudGVyTW9kZSA9PT0gdHJ1ZSA/IF8uc2xpZGVXaWR0aCAqIE1hdGguZmxvb3IoXy5vcHRpb25zLnNsaWRlc1RvU2hvdyAvIDIpIDogMDtcblxuICAgICAgICBpZiAoXy5vcHRpb25zLnN3aXBlVG9TbGlkZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgXy4kc2xpZGVUcmFjay5maW5kKCcuc2xpY2stc2xpZGUnKS5lYWNoKGZ1bmN0aW9uKGluZGV4LCBzbGlkZSkge1xuICAgICAgICAgICAgICAgIGlmIChzbGlkZS5vZmZzZXRMZWZ0IC0gY2VudGVyT2Zmc2V0ICsgKCQoc2xpZGUpLm91dGVyV2lkdGgoKSAvIDIpID4gKF8uc3dpcGVMZWZ0ICogLTEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXBlZFNsaWRlID0gc2xpZGU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgc2xpZGVzVHJhdmVyc2VkID0gTWF0aC5hYnMoJChzd2lwZWRTbGlkZSkuYXR0cignZGF0YS1zbGljay1pbmRleCcpIC0gXy5jdXJyZW50U2xpZGUpIHx8IDE7XG5cbiAgICAgICAgICAgIHJldHVybiBzbGlkZXNUcmF2ZXJzZWQ7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBfLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuZ29UbyA9IFNsaWNrLnByb3RvdHlwZS5zbGlja0dvVG8gPSBmdW5jdGlvbihzbGlkZSwgZG9udEFuaW1hdGUpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgXy5jaGFuZ2VTbGlkZSh7XG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ2luZGV4JyxcbiAgICAgICAgICAgICAgICBpbmRleDogcGFyc2VJbnQoc2xpZGUpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGRvbnRBbmltYXRlKTtcblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKGNyZWF0aW9uKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuXG4gICAgICAgIGlmICghJChfLiRzbGlkZXIpLmhhc0NsYXNzKCdzbGljay1pbml0aWFsaXplZCcpKSB7XG5cbiAgICAgICAgICAgICQoXy4kc2xpZGVyKS5hZGRDbGFzcygnc2xpY2staW5pdGlhbGl6ZWQnKTtcblxuICAgICAgICAgICAgXy5idWlsZFJvd3MoKTtcbiAgICAgICAgICAgIF8uYnVpbGRPdXQoKTtcbiAgICAgICAgICAgIF8uc2V0UHJvcHMoKTtcbiAgICAgICAgICAgIF8uc3RhcnRMb2FkKCk7XG4gICAgICAgICAgICBfLmxvYWRTbGlkZXIoKTtcbiAgICAgICAgICAgIF8uaW5pdGlhbGl6ZUV2ZW50cygpO1xuICAgICAgICAgICAgXy51cGRhdGVBcnJvd3MoKTtcbiAgICAgICAgICAgIF8udXBkYXRlRG90cygpO1xuICAgICAgICAgICAgXy5jaGVja1Jlc3BvbnNpdmUodHJ1ZSk7XG4gICAgICAgICAgICBfLmZvY3VzSGFuZGxlcigpO1xuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY3JlYXRpb24pIHtcbiAgICAgICAgICAgIF8uJHNsaWRlci50cmlnZ2VyKCdpbml0JywgW19dKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfLm9wdGlvbnMuYWNjZXNzaWJpbGl0eSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgXy5pbml0QURBKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIF8ub3B0aW9ucy5hdXRvcGxheSApIHtcblxuICAgICAgICAgICAgXy5wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIF8uYXV0b1BsYXkoKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmluaXRBREEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIF8gPSB0aGlzLFxuICAgICAgICAgICAgICAgIG51bURvdEdyb3VwcyA9IE1hdGguY2VpbChfLnNsaWRlQ291bnQgLyBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KSxcbiAgICAgICAgICAgICAgICB0YWJDb250cm9sSW5kZXhlcyA9IF8uZ2V0TmF2aWdhYmxlSW5kZXhlcygpLmZpbHRlcihmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICh2YWwgPj0gMCkgJiYgKHZhbCA8IF8uc2xpZGVDb3VudCk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgXy4kc2xpZGVzLmFkZChfLiRzbGlkZVRyYWNrLmZpbmQoJy5zbGljay1jbG9uZWQnKSkuYXR0cih7XG4gICAgICAgICAgICAnYXJpYS1oaWRkZW4nOiAndHJ1ZScsXG4gICAgICAgICAgICAndGFiaW5kZXgnOiAnLTEnXG4gICAgICAgIH0pLmZpbmQoJ2EsIGlucHV0LCBidXR0b24sIHNlbGVjdCcpLmF0dHIoe1xuICAgICAgICAgICAgJ3RhYmluZGV4JzogJy0xJ1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoXy4kZG90cyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgXy4kc2xpZGVzLm5vdChfLiRzbGlkZVRyYWNrLmZpbmQoJy5zbGljay1jbG9uZWQnKSkuZWFjaChmdW5jdGlvbihpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNsaWRlQ29udHJvbEluZGV4ID0gdGFiQ29udHJvbEluZGV4ZXMuaW5kZXhPZihpKTtcblxuICAgICAgICAgICAgICAgICQodGhpcykuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgICdyb2xlJzogJ3RhYnBhbmVsJyxcbiAgICAgICAgICAgICAgICAgICAgJ2lkJzogJ3NsaWNrLXNsaWRlJyArIF8uaW5zdGFuY2VVaWQgKyBpLFxuICAgICAgICAgICAgICAgICAgICAndGFiaW5kZXgnOiAtMVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNsaWRlQ29udHJvbEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgIHZhciBhcmlhQnV0dG9uQ29udHJvbCA9ICdzbGljay1zbGlkZS1jb250cm9sJyArIF8uaW5zdGFuY2VVaWQgKyBzbGlkZUNvbnRyb2xJbmRleFxuICAgICAgICAgICAgICAgICAgIGlmICgkKCcjJyArIGFyaWFCdXR0b25Db250cm9sKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICQodGhpcykuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgJ2FyaWEtZGVzY3JpYmVkYnknOiBhcmlhQnV0dG9uQ29udHJvbFxuICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBfLiRkb3RzLmF0dHIoJ3JvbGUnLCAndGFibGlzdCcpLmZpbmQoJ2xpJykuZWFjaChmdW5jdGlvbihpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hcHBlZFNsaWRlSW5kZXggPSB0YWJDb250cm9sSW5kZXhlc1tpXTtcblxuICAgICAgICAgICAgICAgICQodGhpcykuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgICdyb2xlJzogJ3ByZXNlbnRhdGlvbidcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICQodGhpcykuZmluZCgnYnV0dG9uJykuZmlyc3QoKS5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgJ3JvbGUnOiAndGFiJyxcbiAgICAgICAgICAgICAgICAgICAgJ2lkJzogJ3NsaWNrLXNsaWRlLWNvbnRyb2wnICsgXy5pbnN0YW5jZVVpZCArIGksXG4gICAgICAgICAgICAgICAgICAgICdhcmlhLWNvbnRyb2xzJzogJ3NsaWNrLXNsaWRlJyArIF8uaW5zdGFuY2VVaWQgKyBtYXBwZWRTbGlkZUluZGV4LFxuICAgICAgICAgICAgICAgICAgICAnYXJpYS1sYWJlbCc6IChpICsgMSkgKyAnIG9mICcgKyBudW1Eb3RHcm91cHMsXG4gICAgICAgICAgICAgICAgICAgICdhcmlhLXNlbGVjdGVkJzogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgJ3RhYmluZGV4JzogJy0xJ1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9KS5lcShfLmN1cnJlbnRTbGlkZSkuZmluZCgnYnV0dG9uJykuYXR0cih7XG4gICAgICAgICAgICAgICAgJ2FyaWEtc2VsZWN0ZWQnOiAndHJ1ZScsXG4gICAgICAgICAgICAgICAgJ3RhYmluZGV4JzogJzAnXG4gICAgICAgICAgICB9KS5lbmQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGk9Xy5jdXJyZW50U2xpZGUsIG1heD1pK18ub3B0aW9ucy5zbGlkZXNUb1Nob3c7IGkgPCBtYXg7IGkrKykge1xuICAgICAgICAgIGlmIChfLm9wdGlvbnMuZm9jdXNPbkNoYW5nZSkge1xuICAgICAgICAgICAgXy4kc2xpZGVzLmVxKGkpLmF0dHIoeyd0YWJpbmRleCc6ICcwJ30pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfLiRzbGlkZXMuZXEoaSkucmVtb3ZlQXR0cigndGFiaW5kZXgnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBfLmFjdGl2YXRlQURBKCk7XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmluaXRBcnJvd0V2ZW50cyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBpZiAoXy5vcHRpb25zLmFycm93cyA9PT0gdHJ1ZSAmJiBfLnNsaWRlQ291bnQgPiBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KSB7XG4gICAgICAgICAgICBfLiRwcmV2QXJyb3dcbiAgICAgICAgICAgICAgIC5vZmYoJ2NsaWNrLnNsaWNrJylcbiAgICAgICAgICAgICAgIC5vbignY2xpY2suc2xpY2snLCB7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdwcmV2aW91cydcbiAgICAgICAgICAgICAgIH0sIF8uY2hhbmdlU2xpZGUpO1xuICAgICAgICAgICAgXy4kbmV4dEFycm93XG4gICAgICAgICAgICAgICAub2ZmKCdjbGljay5zbGljaycpXG4gICAgICAgICAgICAgICAub24oJ2NsaWNrLnNsaWNrJywge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnbmV4dCdcbiAgICAgICAgICAgICAgIH0sIF8uY2hhbmdlU2xpZGUpO1xuXG4gICAgICAgICAgICBpZiAoXy5vcHRpb25zLmFjY2Vzc2liaWxpdHkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBfLiRwcmV2QXJyb3cub24oJ2tleWRvd24uc2xpY2snLCBfLmtleUhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIF8uJG5leHRBcnJvdy5vbigna2V5ZG93bi5zbGljaycsIF8ua2V5SGFuZGxlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuaW5pdERvdEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBpZiAoXy5vcHRpb25zLmRvdHMgPT09IHRydWUgJiYgXy5zbGlkZUNvdW50ID4gXy5vcHRpb25zLnNsaWRlc1RvU2hvdykge1xuICAgICAgICAgICAgJCgnbGknLCBfLiRkb3RzKS5vbignY2xpY2suc2xpY2snLCB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ2luZGV4J1xuICAgICAgICAgICAgfSwgXy5jaGFuZ2VTbGlkZSk7XG5cbiAgICAgICAgICAgIGlmIChfLm9wdGlvbnMuYWNjZXNzaWJpbGl0eSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIF8uJGRvdHMub24oJ2tleWRvd24uc2xpY2snLCBfLmtleUhhbmRsZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5kb3RzID09PSB0cnVlICYmIF8ub3B0aW9ucy5wYXVzZU9uRG90c0hvdmVyID09PSB0cnVlICYmIF8uc2xpZGVDb3VudCA+IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cpIHtcblxuICAgICAgICAgICAgJCgnbGknLCBfLiRkb3RzKVxuICAgICAgICAgICAgICAgIC5vbignbW91c2VlbnRlci5zbGljaycsICQucHJveHkoXy5pbnRlcnJ1cHQsIF8sIHRydWUpKVxuICAgICAgICAgICAgICAgIC5vbignbW91c2VsZWF2ZS5zbGljaycsICQucHJveHkoXy5pbnRlcnJ1cHQsIF8sIGZhbHNlKSk7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5pbml0U2xpZGVFdmVudHMgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCBfLm9wdGlvbnMucGF1c2VPbkhvdmVyICkge1xuXG4gICAgICAgICAgICBfLiRsaXN0Lm9uKCdtb3VzZWVudGVyLnNsaWNrJywgJC5wcm94eShfLmludGVycnVwdCwgXywgdHJ1ZSkpO1xuICAgICAgICAgICAgXy4kbGlzdC5vbignbW91c2VsZWF2ZS5zbGljaycsICQucHJveHkoXy5pbnRlcnJ1cHQsIF8sIGZhbHNlKSk7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5pbml0aWFsaXplRXZlbnRzID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuXG4gICAgICAgIF8uaW5pdEFycm93RXZlbnRzKCk7XG5cbiAgICAgICAgXy5pbml0RG90RXZlbnRzKCk7XG4gICAgICAgIF8uaW5pdFNsaWRlRXZlbnRzKCk7XG5cbiAgICAgICAgXy4kbGlzdC5vbigndG91Y2hzdGFydC5zbGljayBtb3VzZWRvd24uc2xpY2snLCB7XG4gICAgICAgICAgICBhY3Rpb246ICdzdGFydCdcbiAgICAgICAgfSwgXy5zd2lwZUhhbmRsZXIpO1xuICAgICAgICBfLiRsaXN0Lm9uKCd0b3VjaG1vdmUuc2xpY2sgbW91c2Vtb3ZlLnNsaWNrJywge1xuICAgICAgICAgICAgYWN0aW9uOiAnbW92ZSdcbiAgICAgICAgfSwgXy5zd2lwZUhhbmRsZXIpO1xuICAgICAgICBfLiRsaXN0Lm9uKCd0b3VjaGVuZC5zbGljayBtb3VzZXVwLnNsaWNrJywge1xuICAgICAgICAgICAgYWN0aW9uOiAnZW5kJ1xuICAgICAgICB9LCBfLnN3aXBlSGFuZGxlcik7XG4gICAgICAgIF8uJGxpc3Qub24oJ3RvdWNoY2FuY2VsLnNsaWNrIG1vdXNlbGVhdmUuc2xpY2snLCB7XG4gICAgICAgICAgICBhY3Rpb246ICdlbmQnXG4gICAgICAgIH0sIF8uc3dpcGVIYW5kbGVyKTtcblxuICAgICAgICBfLiRsaXN0Lm9uKCdjbGljay5zbGljaycsIF8uY2xpY2tIYW5kbGVyKTtcblxuICAgICAgICAkKGRvY3VtZW50KS5vbihfLnZpc2liaWxpdHlDaGFuZ2UsICQucHJveHkoXy52aXNpYmlsaXR5LCBfKSk7XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5hY2Nlc3NpYmlsaXR5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICBfLiRsaXN0Lm9uKCdrZXlkb3duLnNsaWNrJywgXy5rZXlIYW5kbGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfLm9wdGlvbnMuZm9jdXNPblNlbGVjdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgJChfLiRzbGlkZVRyYWNrKS5jaGlsZHJlbigpLm9uKCdjbGljay5zbGljaycsIF8uc2VsZWN0SGFuZGxlcik7XG4gICAgICAgIH1cblxuICAgICAgICAkKHdpbmRvdykub24oJ29yaWVudGF0aW9uY2hhbmdlLnNsaWNrLnNsaWNrLScgKyBfLmluc3RhbmNlVWlkLCAkLnByb3h5KF8ub3JpZW50YXRpb25DaGFuZ2UsIF8pKTtcblxuICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZS5zbGljay5zbGljay0nICsgXy5pbnN0YW5jZVVpZCwgJC5wcm94eShfLnJlc2l6ZSwgXykpO1xuXG4gICAgICAgICQoJ1tkcmFnZ2FibGUhPXRydWVdJywgXy4kc2xpZGVUcmFjaykub24oJ2RyYWdzdGFydCcsIF8ucHJldmVudERlZmF1bHQpO1xuXG4gICAgICAgICQod2luZG93KS5vbignbG9hZC5zbGljay5zbGljay0nICsgXy5pbnN0YW5jZVVpZCwgXy5zZXRQb3NpdGlvbik7XG4gICAgICAgICQoXy5zZXRQb3NpdGlvbik7XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmluaXRVSSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBpZiAoXy5vcHRpb25zLmFycm93cyA9PT0gdHJ1ZSAmJiBfLnNsaWRlQ291bnQgPiBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KSB7XG5cbiAgICAgICAgICAgIF8uJHByZXZBcnJvdy5zaG93KCk7XG4gICAgICAgICAgICBfLiRuZXh0QXJyb3cuc2hvdygpO1xuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5vcHRpb25zLmRvdHMgPT09IHRydWUgJiYgXy5zbGlkZUNvdW50ID4gXy5vcHRpb25zLnNsaWRlc1RvU2hvdykge1xuXG4gICAgICAgICAgICBfLiRkb3RzLnNob3coKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmtleUhhbmRsZXIgPSBmdW5jdGlvbihldmVudCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcbiAgICAgICAgIC8vRG9udCBzbGlkZSBpZiB0aGUgY3Vyc29yIGlzIGluc2lkZSB0aGUgZm9ybSBmaWVsZHMgYW5kIGFycm93IGtleXMgYXJlIHByZXNzZWRcbiAgICAgICAgaWYoIWV2ZW50LnRhcmdldC50YWdOYW1lLm1hdGNoKCdURVhUQVJFQXxJTlBVVHxTRUxFQ1QnKSkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDM3ICYmIF8ub3B0aW9ucy5hY2Nlc3NpYmlsaXR5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgXy5jaGFuZ2VTbGlkZSh7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IF8ub3B0aW9ucy5ydGwgPT09IHRydWUgPyAnbmV4dCcgOiAgJ3ByZXZpb3VzJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgPT09IDM5ICYmIF8ub3B0aW9ucy5hY2Nlc3NpYmlsaXR5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgXy5jaGFuZ2VTbGlkZSh7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IF8ub3B0aW9ucy5ydGwgPT09IHRydWUgPyAncHJldmlvdXMnIDogJ25leHQnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5sYXp5TG9hZCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcyxcbiAgICAgICAgICAgIGxvYWRSYW5nZSwgY2xvbmVSYW5nZSwgcmFuZ2VTdGFydCwgcmFuZ2VFbmQ7XG5cbiAgICAgICAgZnVuY3Rpb24gbG9hZEltYWdlcyhpbWFnZXNTY29wZSkge1xuXG4gICAgICAgICAgICAkKCdpbWdbZGF0YS1sYXp5XScsIGltYWdlc1Njb3BlKS5lYWNoKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgdmFyIGltYWdlID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VTb3VyY2UgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtbGF6eScpLFxuICAgICAgICAgICAgICAgICAgICBpbWFnZVNyY1NldCA9ICQodGhpcykuYXR0cignZGF0YS1zcmNzZXQnKSxcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VTaXplcyAgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtc2l6ZXMnKSB8fCBfLiRzbGlkZXIuYXR0cignZGF0YS1zaXplcycpLFxuICAgICAgICAgICAgICAgICAgICBpbWFnZVRvTG9hZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuXG4gICAgICAgICAgICAgICAgaW1hZ2VUb0xvYWQub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hbmltYXRlKHsgb3BhY2l0eTogMCB9LCAxMDAsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGltYWdlU3JjU2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignc3Jjc2V0JywgaW1hZ2VTcmNTZXQgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW1hZ2VTaXplcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignc2l6ZXMnLCBpbWFnZVNpemVzICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignc3JjJywgaW1hZ2VTb3VyY2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hbmltYXRlKHsgb3BhY2l0eTogMSB9LCAyMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cignZGF0YS1sYXp5IGRhdGEtc3Jjc2V0IGRhdGEtc2l6ZXMnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnc2xpY2stbG9hZGluZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLiRzbGlkZXIudHJpZ2dlcignbGF6eUxvYWRlZCcsIFtfLCBpbWFnZSwgaW1hZ2VTb3VyY2VdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGltYWdlVG9Mb2FkLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgICAgICBpbWFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUF0dHIoICdkYXRhLWxhenknIClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcyggJ3NsaWNrLWxvYWRpbmcnIClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcyggJ3NsaWNrLWxhenlsb2FkLWVycm9yJyApO1xuXG4gICAgICAgICAgICAgICAgICAgIF8uJHNsaWRlci50cmlnZ2VyKCdsYXp5TG9hZEVycm9yJywgWyBfLCBpbWFnZSwgaW1hZ2VTb3VyY2UgXSk7XG5cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaW1hZ2VUb0xvYWQuc3JjID0gaW1hZ2VTb3VyY2U7XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5vcHRpb25zLmNlbnRlck1vZGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGlmIChfLm9wdGlvbnMuaW5maW5pdGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByYW5nZVN0YXJ0ID0gXy5jdXJyZW50U2xpZGUgKyAoXy5vcHRpb25zLnNsaWRlc1RvU2hvdyAvIDIgKyAxKTtcbiAgICAgICAgICAgICAgICByYW5nZUVuZCA9IHJhbmdlU3RhcnQgKyBfLm9wdGlvbnMuc2xpZGVzVG9TaG93ICsgMjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmFuZ2VTdGFydCA9IE1hdGgubWF4KDAsIF8uY3VycmVudFNsaWRlIC0gKF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cgLyAyICsgMSkpO1xuICAgICAgICAgICAgICAgIHJhbmdlRW5kID0gMiArIChfLm9wdGlvbnMuc2xpZGVzVG9TaG93IC8gMiArIDEpICsgXy5jdXJyZW50U2xpZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByYW5nZVN0YXJ0ID0gXy5vcHRpb25zLmluZmluaXRlID8gXy5vcHRpb25zLnNsaWRlc1RvU2hvdyArIF8uY3VycmVudFNsaWRlIDogXy5jdXJyZW50U2xpZGU7XG4gICAgICAgICAgICByYW5nZUVuZCA9IE1hdGguY2VpbChyYW5nZVN0YXJ0ICsgXy5vcHRpb25zLnNsaWRlc1RvU2hvdyk7XG4gICAgICAgICAgICBpZiAoXy5vcHRpb25zLmZhZGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBpZiAocmFuZ2VTdGFydCA+IDApIHJhbmdlU3RhcnQtLTtcbiAgICAgICAgICAgICAgICBpZiAocmFuZ2VFbmQgPD0gXy5zbGlkZUNvdW50KSByYW5nZUVuZCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbG9hZFJhbmdlID0gXy4kc2xpZGVyLmZpbmQoJy5zbGljay1zbGlkZScpLnNsaWNlKHJhbmdlU3RhcnQsIHJhbmdlRW5kKTtcblxuICAgICAgICBpZiAoXy5vcHRpb25zLmxhenlMb2FkID09PSAnYW50aWNpcGF0ZWQnKSB7XG4gICAgICAgICAgICB2YXIgcHJldlNsaWRlID0gcmFuZ2VTdGFydCAtIDEsXG4gICAgICAgICAgICAgICAgbmV4dFNsaWRlID0gcmFuZ2VFbmQsXG4gICAgICAgICAgICAgICAgJHNsaWRlcyA9IF8uJHNsaWRlci5maW5kKCcuc2xpY2stc2xpZGUnKTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGw7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChwcmV2U2xpZGUgPCAwKSBwcmV2U2xpZGUgPSBfLnNsaWRlQ291bnQgLSAxO1xuICAgICAgICAgICAgICAgIGxvYWRSYW5nZSA9IGxvYWRSYW5nZS5hZGQoJHNsaWRlcy5lcShwcmV2U2xpZGUpKTtcbiAgICAgICAgICAgICAgICBsb2FkUmFuZ2UgPSBsb2FkUmFuZ2UuYWRkKCRzbGlkZXMuZXEobmV4dFNsaWRlKSk7XG4gICAgICAgICAgICAgICAgcHJldlNsaWRlLS07XG4gICAgICAgICAgICAgICAgbmV4dFNsaWRlKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsb2FkSW1hZ2VzKGxvYWRSYW5nZSk7XG5cbiAgICAgICAgaWYgKF8uc2xpZGVDb3VudCA8PSBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KSB7XG4gICAgICAgICAgICBjbG9uZVJhbmdlID0gXy4kc2xpZGVyLmZpbmQoJy5zbGljay1zbGlkZScpO1xuICAgICAgICAgICAgbG9hZEltYWdlcyhjbG9uZVJhbmdlKTtcbiAgICAgICAgfSBlbHNlXG4gICAgICAgIGlmIChfLmN1cnJlbnRTbGlkZSA+PSBfLnNsaWRlQ291bnQgLSBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KSB7XG4gICAgICAgICAgICBjbG9uZVJhbmdlID0gXy4kc2xpZGVyLmZpbmQoJy5zbGljay1jbG9uZWQnKS5zbGljZSgwLCBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KTtcbiAgICAgICAgICAgIGxvYWRJbWFnZXMoY2xvbmVSYW5nZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoXy5jdXJyZW50U2xpZGUgPT09IDApIHtcbiAgICAgICAgICAgIGNsb25lUmFuZ2UgPSBfLiRzbGlkZXIuZmluZCgnLnNsaWNrLWNsb25lZCcpLnNsaWNlKF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cgKiAtMSk7XG4gICAgICAgICAgICBsb2FkSW1hZ2VzKGNsb25lUmFuZ2UpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmxvYWRTbGlkZXIgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgXy5zZXRQb3NpdGlvbigpO1xuXG4gICAgICAgIF8uJHNsaWRlVHJhY2suY3NzKHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDFcbiAgICAgICAgfSk7XG5cbiAgICAgICAgXy4kc2xpZGVyLnJlbW92ZUNsYXNzKCdzbGljay1sb2FkaW5nJyk7XG5cbiAgICAgICAgXy5pbml0VUkoKTtcblxuICAgICAgICBpZiAoXy5vcHRpb25zLmxhenlMb2FkID09PSAncHJvZ3Jlc3NpdmUnKSB7XG4gICAgICAgICAgICBfLnByb2dyZXNzaXZlTGF6eUxvYWQoKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5uZXh0ID0gU2xpY2sucHJvdG90eXBlLnNsaWNrTmV4dCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBfLmNoYW5nZVNsaWRlKHtcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnbmV4dCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLm9yaWVudGF0aW9uQ2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuXG4gICAgICAgIF8uY2hlY2tSZXNwb25zaXZlKCk7XG4gICAgICAgIF8uc2V0UG9zaXRpb24oKTtcblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUucGF1c2UgPSBTbGljay5wcm90b3R5cGUuc2xpY2tQYXVzZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBfLmF1dG9QbGF5Q2xlYXIoKTtcbiAgICAgICAgXy5wYXVzZWQgPSB0cnVlO1xuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5wbGF5ID0gU2xpY2sucHJvdG90eXBlLnNsaWNrUGxheSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBfLmF1dG9QbGF5KCk7XG4gICAgICAgIF8ub3B0aW9ucy5hdXRvcGxheSA9IHRydWU7XG4gICAgICAgIF8ucGF1c2VkID0gZmFsc2U7XG4gICAgICAgIF8uZm9jdXNzZWQgPSBmYWxzZTtcbiAgICAgICAgXy5pbnRlcnJ1cHRlZCA9IGZhbHNlO1xuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5wb3N0U2xpZGUgPSBmdW5jdGlvbihpbmRleCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBpZiggIV8udW5zbGlja2VkICkge1xuXG4gICAgICAgICAgICBfLiRzbGlkZXIudHJpZ2dlcignYWZ0ZXJDaGFuZ2UnLCBbXywgaW5kZXhdKTtcblxuICAgICAgICAgICAgXy5hbmltYXRpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKF8uc2xpZGVDb3VudCA+IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cpIHtcbiAgICAgICAgICAgICAgICBfLnNldFBvc2l0aW9uKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF8uc3dpcGVMZWZ0ID0gbnVsbDtcblxuICAgICAgICAgICAgaWYgKCBfLm9wdGlvbnMuYXV0b3BsYXkgKSB7XG4gICAgICAgICAgICAgICAgXy5hdXRvUGxheSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXy5vcHRpb25zLmFjY2Vzc2liaWxpdHkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBfLmluaXRBREEoKTtcblxuICAgICAgICAgICAgICAgIGlmIChfLm9wdGlvbnMuZm9jdXNPbkNoYW5nZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJGN1cnJlbnRTbGlkZSA9ICQoXy4kc2xpZGVzLmdldChfLmN1cnJlbnRTbGlkZSkpO1xuICAgICAgICAgICAgICAgICAgICAkY3VycmVudFNsaWRlLmF0dHIoJ3RhYmluZGV4JywgMCkuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5wcmV2ID0gU2xpY2sucHJvdG90eXBlLnNsaWNrUHJldiA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBfLmNoYW5nZVNsaWRlKHtcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAncHJldmlvdXMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUucHJvZ3Jlc3NpdmVMYXp5TG9hZCA9IGZ1bmN0aW9uKCB0cnlDb3VudCApIHtcblxuICAgICAgICB0cnlDb3VudCA9IHRyeUNvdW50IHx8IDE7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzLFxuICAgICAgICAgICAgJGltZ3NUb0xvYWQgPSAkKCAnaW1nW2RhdGEtbGF6eV0nLCBfLiRzbGlkZXIgKSxcbiAgICAgICAgICAgIGltYWdlLFxuICAgICAgICAgICAgaW1hZ2VTb3VyY2UsXG4gICAgICAgICAgICBpbWFnZVNyY1NldCxcbiAgICAgICAgICAgIGltYWdlU2l6ZXMsXG4gICAgICAgICAgICBpbWFnZVRvTG9hZDtcblxuICAgICAgICBpZiAoICRpbWdzVG9Mb2FkLmxlbmd0aCApIHtcblxuICAgICAgICAgICAgaW1hZ2UgPSAkaW1nc1RvTG9hZC5maXJzdCgpO1xuICAgICAgICAgICAgaW1hZ2VTb3VyY2UgPSBpbWFnZS5hdHRyKCdkYXRhLWxhenknKTtcbiAgICAgICAgICAgIGltYWdlU3JjU2V0ID0gaW1hZ2UuYXR0cignZGF0YS1zcmNzZXQnKTtcbiAgICAgICAgICAgIGltYWdlU2l6ZXMgID0gaW1hZ2UuYXR0cignZGF0YS1zaXplcycpIHx8IF8uJHNsaWRlci5hdHRyKCdkYXRhLXNpemVzJyk7XG4gICAgICAgICAgICBpbWFnZVRvTG9hZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuXG4gICAgICAgICAgICBpbWFnZVRvTG9hZC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgIGlmIChpbWFnZVNyY1NldCkge1xuICAgICAgICAgICAgICAgICAgICBpbWFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3NyY3NldCcsIGltYWdlU3JjU2V0ICk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGltYWdlU2l6ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3NpemVzJywgaW1hZ2VTaXplcyApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoICdzcmMnLCBpbWFnZVNvdXJjZSApXG4gICAgICAgICAgICAgICAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLWxhenkgZGF0YS1zcmNzZXQgZGF0YS1zaXplcycpXG4gICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnc2xpY2stbG9hZGluZycpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCBfLm9wdGlvbnMuYWRhcHRpdmVIZWlnaHQgPT09IHRydWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIF8uc2V0UG9zaXRpb24oKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBfLiRzbGlkZXIudHJpZ2dlcignbGF6eUxvYWRlZCcsIFsgXywgaW1hZ2UsIGltYWdlU291cmNlIF0pO1xuICAgICAgICAgICAgICAgIF8ucHJvZ3Jlc3NpdmVMYXp5TG9hZCgpO1xuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpbWFnZVRvTG9hZC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoIHRyeUNvdW50IDwgMyApIHtcblxuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogdHJ5IHRvIGxvYWQgdGhlIGltYWdlIDMgdGltZXMsXG4gICAgICAgICAgICAgICAgICAgICAqIGxlYXZlIGEgc2xpZ2h0IGRlbGF5IHNvIHdlIGRvbid0IGdldFxuICAgICAgICAgICAgICAgICAgICAgKiBzZXJ2ZXJzIGJsb2NraW5nIHRoZSByZXF1ZXN0LlxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfLnByb2dyZXNzaXZlTGF6eUxvYWQoIHRyeUNvdW50ICsgMSApO1xuICAgICAgICAgICAgICAgICAgICB9LCA1MDAgKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVBdHRyKCAnZGF0YS1sYXp5JyApXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoICdzbGljay1sb2FkaW5nJyApXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoICdzbGljay1sYXp5bG9hZC1lcnJvcicgKTtcblxuICAgICAgICAgICAgICAgICAgICBfLiRzbGlkZXIudHJpZ2dlcignbGF6eUxvYWRFcnJvcicsIFsgXywgaW1hZ2UsIGltYWdlU291cmNlIF0pO1xuXG4gICAgICAgICAgICAgICAgICAgIF8ucHJvZ3Jlc3NpdmVMYXp5TG9hZCgpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpbWFnZVRvTG9hZC5zcmMgPSBpbWFnZVNvdXJjZTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBfLiRzbGlkZXIudHJpZ2dlcignYWxsSW1hZ2VzTG9hZGVkJywgWyBfIF0pO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUucmVmcmVzaCA9IGZ1bmN0aW9uKCBpbml0aWFsaXppbmcgKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzLCBjdXJyZW50U2xpZGUsIGxhc3RWaXNpYmxlSW5kZXg7XG5cbiAgICAgICAgbGFzdFZpc2libGVJbmRleCA9IF8uc2xpZGVDb3VudCAtIF8ub3B0aW9ucy5zbGlkZXNUb1Nob3c7XG5cbiAgICAgICAgLy8gaW4gbm9uLWluZmluaXRlIHNsaWRlcnMsIHdlIGRvbid0IHdhbnQgdG8gZ28gcGFzdCB0aGVcbiAgICAgICAgLy8gbGFzdCB2aXNpYmxlIGluZGV4LlxuICAgICAgICBpZiggIV8ub3B0aW9ucy5pbmZpbml0ZSAmJiAoIF8uY3VycmVudFNsaWRlID4gbGFzdFZpc2libGVJbmRleCApKSB7XG4gICAgICAgICAgICBfLmN1cnJlbnRTbGlkZSA9IGxhc3RWaXNpYmxlSW5kZXg7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBsZXNzIHNsaWRlcyB0aGFuIHRvIHNob3csIGdvIHRvIHN0YXJ0LlxuICAgICAgICBpZiAoIF8uc2xpZGVDb3VudCA8PSBfLm9wdGlvbnMuc2xpZGVzVG9TaG93ICkge1xuICAgICAgICAgICAgXy5jdXJyZW50U2xpZGUgPSAwO1xuXG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50U2xpZGUgPSBfLmN1cnJlbnRTbGlkZTtcblxuICAgICAgICBfLmRlc3Ryb3kodHJ1ZSk7XG5cbiAgICAgICAgJC5leHRlbmQoXywgXy5pbml0aWFscywgeyBjdXJyZW50U2xpZGU6IGN1cnJlbnRTbGlkZSB9KTtcblxuICAgICAgICBfLmluaXQoKTtcblxuICAgICAgICBpZiggIWluaXRpYWxpemluZyApIHtcblxuICAgICAgICAgICAgXy5jaGFuZ2VTbGlkZSh7XG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnaW5kZXgnLFxuICAgICAgICAgICAgICAgICAgICBpbmRleDogY3VycmVudFNsaWRlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUucmVnaXN0ZXJCcmVha3BvaW50cyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcywgYnJlYWtwb2ludCwgY3VycmVudEJyZWFrcG9pbnQsIGwsXG4gICAgICAgICAgICByZXNwb25zaXZlU2V0dGluZ3MgPSBfLm9wdGlvbnMucmVzcG9uc2l2ZSB8fCBudWxsO1xuXG4gICAgICAgIGlmICggJC50eXBlKHJlc3BvbnNpdmVTZXR0aW5ncykgPT09ICdhcnJheScgJiYgcmVzcG9uc2l2ZVNldHRpbmdzLmxlbmd0aCApIHtcblxuICAgICAgICAgICAgXy5yZXNwb25kVG8gPSBfLm9wdGlvbnMucmVzcG9uZFRvIHx8ICd3aW5kb3cnO1xuXG4gICAgICAgICAgICBmb3IgKCBicmVha3BvaW50IGluIHJlc3BvbnNpdmVTZXR0aW5ncyApIHtcblxuICAgICAgICAgICAgICAgIGwgPSBfLmJyZWFrcG9pbnRzLmxlbmd0aC0xO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNpdmVTZXR0aW5ncy5oYXNPd25Qcm9wZXJ0eShicmVha3BvaW50KSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50QnJlYWtwb2ludCA9IHJlc3BvbnNpdmVTZXR0aW5nc1ticmVha3BvaW50XS5icmVha3BvaW50O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCB0aGUgYnJlYWtwb2ludHMgYW5kIGN1dCBvdXQgYW55IGV4aXN0aW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIG9uZXMgd2l0aCB0aGUgc2FtZSBicmVha3BvaW50IG51bWJlciwgd2UgZG9uJ3Qgd2FudCBkdXBlcy5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUoIGwgPj0gMCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCBfLmJyZWFrcG9pbnRzW2xdICYmIF8uYnJlYWtwb2ludHNbbF0gPT09IGN1cnJlbnRCcmVha3BvaW50ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uYnJlYWtwb2ludHMuc3BsaWNlKGwsMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsLS07XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBfLmJyZWFrcG9pbnRzLnB1c2goY3VycmVudEJyZWFrcG9pbnQpO1xuICAgICAgICAgICAgICAgICAgICBfLmJyZWFrcG9pbnRTZXR0aW5nc1tjdXJyZW50QnJlYWtwb2ludF0gPSByZXNwb25zaXZlU2V0dGluZ3NbYnJlYWtwb2ludF0uc2V0dGluZ3M7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgXy5icmVha3BvaW50cy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKCBfLm9wdGlvbnMubW9iaWxlRmlyc3QgKSA/IGEtYiA6IGItYTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUucmVpbml0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuXG4gICAgICAgIF8uJHNsaWRlcyA9XG4gICAgICAgICAgICBfLiRzbGlkZVRyYWNrXG4gICAgICAgICAgICAgICAgLmNoaWxkcmVuKF8ub3B0aW9ucy5zbGlkZSlcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3NsaWNrLXNsaWRlJyk7XG5cbiAgICAgICAgXy5zbGlkZUNvdW50ID0gXy4kc2xpZGVzLmxlbmd0aDtcblxuICAgICAgICBpZiAoXy5jdXJyZW50U2xpZGUgPj0gXy5zbGlkZUNvdW50ICYmIF8uY3VycmVudFNsaWRlICE9PSAwKSB7XG4gICAgICAgICAgICBfLmN1cnJlbnRTbGlkZSA9IF8uY3VycmVudFNsaWRlIC0gXy5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8uc2xpZGVDb3VudCA8PSBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KSB7XG4gICAgICAgICAgICBfLmN1cnJlbnRTbGlkZSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBfLnJlZ2lzdGVyQnJlYWtwb2ludHMoKTtcblxuICAgICAgICBfLnNldFByb3BzKCk7XG4gICAgICAgIF8uc2V0dXBJbmZpbml0ZSgpO1xuICAgICAgICBfLmJ1aWxkQXJyb3dzKCk7XG4gICAgICAgIF8udXBkYXRlQXJyb3dzKCk7XG4gICAgICAgIF8uaW5pdEFycm93RXZlbnRzKCk7XG4gICAgICAgIF8uYnVpbGREb3RzKCk7XG4gICAgICAgIF8udXBkYXRlRG90cygpO1xuICAgICAgICBfLmluaXREb3RFdmVudHMoKTtcbiAgICAgICAgXy5jbGVhblVwU2xpZGVFdmVudHMoKTtcbiAgICAgICAgXy5pbml0U2xpZGVFdmVudHMoKTtcblxuICAgICAgICBfLmNoZWNrUmVzcG9uc2l2ZShmYWxzZSwgdHJ1ZSk7XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5mb2N1c09uU2VsZWN0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAkKF8uJHNsaWRlVHJhY2spLmNoaWxkcmVuKCkub24oJ2NsaWNrLnNsaWNrJywgXy5zZWxlY3RIYW5kbGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF8uc2V0U2xpZGVDbGFzc2VzKHR5cGVvZiBfLmN1cnJlbnRTbGlkZSA9PT0gJ251bWJlcicgPyBfLmN1cnJlbnRTbGlkZSA6IDApO1xuXG4gICAgICAgIF8uc2V0UG9zaXRpb24oKTtcbiAgICAgICAgXy5mb2N1c0hhbmRsZXIoKTtcblxuICAgICAgICBfLnBhdXNlZCA9ICFfLm9wdGlvbnMuYXV0b3BsYXk7XG4gICAgICAgIF8uYXV0b1BsYXkoKTtcblxuICAgICAgICBfLiRzbGlkZXIudHJpZ2dlcigncmVJbml0JywgW19dKTtcblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuXG4gICAgICAgIGlmICgkKHdpbmRvdykud2lkdGgoKSAhPT0gXy53aW5kb3dXaWR0aCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF8ud2luZG93RGVsYXkpO1xuICAgICAgICAgICAgXy53aW5kb3dEZWxheSA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIF8ud2luZG93V2lkdGggPSAkKHdpbmRvdykud2lkdGgoKTtcbiAgICAgICAgICAgICAgICBfLmNoZWNrUmVzcG9uc2l2ZSgpO1xuICAgICAgICAgICAgICAgIGlmKCAhXy51bnNsaWNrZWQgKSB7IF8uc2V0UG9zaXRpb24oKTsgfVxuICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5yZW1vdmVTbGlkZSA9IFNsaWNrLnByb3RvdHlwZS5zbGlja1JlbW92ZSA9IGZ1bmN0aW9uKGluZGV4LCByZW1vdmVCZWZvcmUsIHJlbW92ZUFsbCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBpZiAodHlwZW9mKGluZGV4KSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICByZW1vdmVCZWZvcmUgPSBpbmRleDtcbiAgICAgICAgICAgIGluZGV4ID0gcmVtb3ZlQmVmb3JlID09PSB0cnVlID8gMCA6IF8uc2xpZGVDb3VudCAtIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbmRleCA9IHJlbW92ZUJlZm9yZSA9PT0gdHJ1ZSA/IC0taW5kZXggOiBpbmRleDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfLnNsaWRlQ291bnQgPCAxIHx8IGluZGV4IDwgMCB8fCBpbmRleCA+IF8uc2xpZGVDb3VudCAtIDEpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIF8udW5sb2FkKCk7XG5cbiAgICAgICAgaWYgKHJlbW92ZUFsbCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgXy4kc2xpZGVUcmFjay5jaGlsZHJlbigpLnJlbW92ZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgXy4kc2xpZGVUcmFjay5jaGlsZHJlbih0aGlzLm9wdGlvbnMuc2xpZGUpLmVxKGluZGV4KS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF8uJHNsaWRlcyA9IF8uJHNsaWRlVHJhY2suY2hpbGRyZW4odGhpcy5vcHRpb25zLnNsaWRlKTtcblxuICAgICAgICBfLiRzbGlkZVRyYWNrLmNoaWxkcmVuKHRoaXMub3B0aW9ucy5zbGlkZSkuZGV0YWNoKCk7XG5cbiAgICAgICAgXy4kc2xpZGVUcmFjay5hcHBlbmQoXy4kc2xpZGVzKTtcblxuICAgICAgICBfLiRzbGlkZXNDYWNoZSA9IF8uJHNsaWRlcztcblxuICAgICAgICBfLnJlaW5pdCgpO1xuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5zZXRDU1MgPSBmdW5jdGlvbihwb3NpdGlvbikge1xuXG4gICAgICAgIHZhciBfID0gdGhpcyxcbiAgICAgICAgICAgIHBvc2l0aW9uUHJvcHMgPSB7fSxcbiAgICAgICAgICAgIHgsIHk7XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5ydGwgPT09IHRydWUpIHtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gLXBvc2l0aW9uO1xuICAgICAgICB9XG4gICAgICAgIHggPSBfLnBvc2l0aW9uUHJvcCA9PSAnbGVmdCcgPyBNYXRoLmNlaWwocG9zaXRpb24pICsgJ3B4JyA6ICcwcHgnO1xuICAgICAgICB5ID0gXy5wb3NpdGlvblByb3AgPT0gJ3RvcCcgPyBNYXRoLmNlaWwocG9zaXRpb24pICsgJ3B4JyA6ICcwcHgnO1xuXG4gICAgICAgIHBvc2l0aW9uUHJvcHNbXy5wb3NpdGlvblByb3BdID0gcG9zaXRpb247XG5cbiAgICAgICAgaWYgKF8udHJhbnNmb3Jtc0VuYWJsZWQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBfLiRzbGlkZVRyYWNrLmNzcyhwb3NpdGlvblByb3BzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBvc2l0aW9uUHJvcHMgPSB7fTtcbiAgICAgICAgICAgIGlmIChfLmNzc1RyYW5zaXRpb25zID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uUHJvcHNbXy5hbmltVHlwZV0gPSAndHJhbnNsYXRlKCcgKyB4ICsgJywgJyArIHkgKyAnKSc7XG4gICAgICAgICAgICAgICAgXy4kc2xpZGVUcmFjay5jc3MocG9zaXRpb25Qcm9wcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uUHJvcHNbXy5hbmltVHlwZV0gPSAndHJhbnNsYXRlM2QoJyArIHggKyAnLCAnICsgeSArICcsIDBweCknO1xuICAgICAgICAgICAgICAgIF8uJHNsaWRlVHJhY2suY3NzKHBvc2l0aW9uUHJvcHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLnNldERpbWVuc2lvbnMgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy52ZXJ0aWNhbCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGlmIChfLm9wdGlvbnMuY2VudGVyTW9kZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIF8uJGxpc3QuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogKCcwcHggJyArIF8ub3B0aW9ucy5jZW50ZXJQYWRkaW5nKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgXy4kbGlzdC5oZWlnaHQoXy4kc2xpZGVzLmZpcnN0KCkub3V0ZXJIZWlnaHQodHJ1ZSkgKiBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KTtcbiAgICAgICAgICAgIGlmIChfLm9wdGlvbnMuY2VudGVyTW9kZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIF8uJGxpc3QuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogKF8ub3B0aW9ucy5jZW50ZXJQYWRkaW5nICsgJyAwcHgnKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgXy5saXN0V2lkdGggPSBfLiRsaXN0LndpZHRoKCk7XG4gICAgICAgIF8ubGlzdEhlaWdodCA9IF8uJGxpc3QuaGVpZ2h0KCk7XG5cblxuICAgICAgICBpZiAoXy5vcHRpb25zLnZlcnRpY2FsID09PSBmYWxzZSAmJiBfLm9wdGlvbnMudmFyaWFibGVXaWR0aCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIF8uc2xpZGVXaWR0aCA9IE1hdGguY2VpbChfLmxpc3RXaWR0aCAvIF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cpO1xuICAgICAgICAgICAgXy4kc2xpZGVUcmFjay53aWR0aChNYXRoLmNlaWwoKF8uc2xpZGVXaWR0aCAqIF8uJHNsaWRlVHJhY2suY2hpbGRyZW4oJy5zbGljay1zbGlkZScpLmxlbmd0aCkpKTtcblxuICAgICAgICB9IGVsc2UgaWYgKF8ub3B0aW9ucy52YXJpYWJsZVdpZHRoID09PSB0cnVlKSB7XG4gICAgICAgICAgICBfLiRzbGlkZVRyYWNrLndpZHRoKDUwMDAgKiBfLnNsaWRlQ291bnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgXy5zbGlkZVdpZHRoID0gTWF0aC5jZWlsKF8ubGlzdFdpZHRoKTtcbiAgICAgICAgICAgIF8uJHNsaWRlVHJhY2suaGVpZ2h0KE1hdGguY2VpbCgoXy4kc2xpZGVzLmZpcnN0KCkub3V0ZXJIZWlnaHQodHJ1ZSkgKiBfLiRzbGlkZVRyYWNrLmNoaWxkcmVuKCcuc2xpY2stc2xpZGUnKS5sZW5ndGgpKSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb2Zmc2V0ID0gXy4kc2xpZGVzLmZpcnN0KCkub3V0ZXJXaWR0aCh0cnVlKSAtIF8uJHNsaWRlcy5maXJzdCgpLndpZHRoKCk7XG4gICAgICAgIGlmIChfLm9wdGlvbnMudmFyaWFibGVXaWR0aCA9PT0gZmFsc2UpIF8uJHNsaWRlVHJhY2suY2hpbGRyZW4oJy5zbGljay1zbGlkZScpLndpZHRoKF8uc2xpZGVXaWR0aCAtIG9mZnNldCk7XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLnNldEZhZGUgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXMsXG4gICAgICAgICAgICB0YXJnZXRMZWZ0O1xuXG4gICAgICAgIF8uJHNsaWRlcy5lYWNoKGZ1bmN0aW9uKGluZGV4LCBlbGVtZW50KSB7XG4gICAgICAgICAgICB0YXJnZXRMZWZ0ID0gKF8uc2xpZGVXaWR0aCAqIGluZGV4KSAqIC0xO1xuICAgICAgICAgICAgaWYgKF8ub3B0aW9ucy5ydGwgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICAgICAgICAgICAgICByaWdodDogdGFyZ2V0TGVmdCxcbiAgICAgICAgICAgICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgICAgICAgICAgICB6SW5kZXg6IF8ub3B0aW9ucy56SW5kZXggLSAyLFxuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQoZWxlbWVudCkuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IHRhcmdldExlZnQsXG4gICAgICAgICAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgICAgICAgICAgekluZGV4OiBfLm9wdGlvbnMuekluZGV4IC0gMixcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBfLiRzbGlkZXMuZXEoXy5jdXJyZW50U2xpZGUpLmNzcyh7XG4gICAgICAgICAgICB6SW5kZXg6IF8ub3B0aW9ucy56SW5kZXggLSAxLFxuICAgICAgICAgICAgb3BhY2l0eTogMVxuICAgICAgICB9KTtcblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuc2V0SGVpZ2h0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuXG4gICAgICAgIGlmIChfLm9wdGlvbnMuc2xpZGVzVG9TaG93ID09PSAxICYmIF8ub3B0aW9ucy5hZGFwdGl2ZUhlaWdodCA9PT0gdHJ1ZSAmJiBfLm9wdGlvbnMudmVydGljYWwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0SGVpZ2h0ID0gXy4kc2xpZGVzLmVxKF8uY3VycmVudFNsaWRlKS5vdXRlckhlaWdodCh0cnVlKTtcbiAgICAgICAgICAgIF8uJGxpc3QuY3NzKCdoZWlnaHQnLCB0YXJnZXRIZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLnNldE9wdGlvbiA9XG4gICAgU2xpY2sucHJvdG90eXBlLnNsaWNrU2V0T3B0aW9uID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGFjY2VwdHMgYXJndW1lbnRzIGluIGZvcm1hdCBvZjpcbiAgICAgICAgICpcbiAgICAgICAgICogIC0gZm9yIGNoYW5naW5nIGEgc2luZ2xlIG9wdGlvbidzIHZhbHVlOlxuICAgICAgICAgKiAgICAgLnNsaWNrKFwic2V0T3B0aW9uXCIsIG9wdGlvbiwgdmFsdWUsIHJlZnJlc2ggKVxuICAgICAgICAgKlxuICAgICAgICAgKiAgLSBmb3IgY2hhbmdpbmcgYSBzZXQgb2YgcmVzcG9uc2l2ZSBvcHRpb25zOlxuICAgICAgICAgKiAgICAgLnNsaWNrKFwic2V0T3B0aW9uXCIsICdyZXNwb25zaXZlJywgW3t9LCAuLi5dLCByZWZyZXNoIClcbiAgICAgICAgICpcbiAgICAgICAgICogIC0gZm9yIHVwZGF0aW5nIG11bHRpcGxlIHZhbHVlcyBhdCBvbmNlIChub3QgcmVzcG9uc2l2ZSlcbiAgICAgICAgICogICAgIC5zbGljayhcInNldE9wdGlvblwiLCB7ICdvcHRpb24nOiB2YWx1ZSwgLi4uIH0sIHJlZnJlc2ggKVxuICAgICAgICAgKi9cblxuICAgICAgICB2YXIgXyA9IHRoaXMsIGwsIGl0ZW0sIG9wdGlvbiwgdmFsdWUsIHJlZnJlc2ggPSBmYWxzZSwgdHlwZTtcblxuICAgICAgICBpZiggJC50eXBlKCBhcmd1bWVudHNbMF0gKSA9PT0gJ29iamVjdCcgKSB7XG5cbiAgICAgICAgICAgIG9wdGlvbiA9ICBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICByZWZyZXNoID0gYXJndW1lbnRzWzFdO1xuICAgICAgICAgICAgdHlwZSA9ICdtdWx0aXBsZSc7XG5cbiAgICAgICAgfSBlbHNlIGlmICggJC50eXBlKCBhcmd1bWVudHNbMF0gKSA9PT0gJ3N0cmluZycgKSB7XG5cbiAgICAgICAgICAgIG9wdGlvbiA9ICBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICB2YWx1ZSA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgICAgIHJlZnJlc2ggPSBhcmd1bWVudHNbMl07XG5cbiAgICAgICAgICAgIGlmICggYXJndW1lbnRzWzBdID09PSAncmVzcG9uc2l2ZScgJiYgJC50eXBlKCBhcmd1bWVudHNbMV0gKSA9PT0gJ2FycmF5JyApIHtcblxuICAgICAgICAgICAgICAgIHR5cGUgPSAncmVzcG9uc2l2ZSc7XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIHR5cGVvZiBhcmd1bWVudHNbMV0gIT09ICd1bmRlZmluZWQnICkge1xuXG4gICAgICAgICAgICAgICAgdHlwZSA9ICdzaW5nbGUnO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggdHlwZSA9PT0gJ3NpbmdsZScgKSB7XG5cbiAgICAgICAgICAgIF8ub3B0aW9uc1tvcHRpb25dID0gdmFsdWU7XG5cblxuICAgICAgICB9IGVsc2UgaWYgKCB0eXBlID09PSAnbXVsdGlwbGUnICkge1xuXG4gICAgICAgICAgICAkLmVhY2goIG9wdGlvbiAsIGZ1bmN0aW9uKCBvcHQsIHZhbCApIHtcblxuICAgICAgICAgICAgICAgIF8ub3B0aW9uc1tvcHRdID0gdmFsO1xuXG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgIH0gZWxzZSBpZiAoIHR5cGUgPT09ICdyZXNwb25zaXZlJyApIHtcblxuICAgICAgICAgICAgZm9yICggaXRlbSBpbiB2YWx1ZSApIHtcblxuICAgICAgICAgICAgICAgIGlmKCAkLnR5cGUoIF8ub3B0aW9ucy5yZXNwb25zaXZlICkgIT09ICdhcnJheScgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgXy5vcHRpb25zLnJlc3BvbnNpdmUgPSBbIHZhbHVlW2l0ZW1dIF07XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIGwgPSBfLm9wdGlvbnMucmVzcG9uc2l2ZS5sZW5ndGgtMTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBsb29wIHRocm91Z2ggdGhlIHJlc3BvbnNpdmUgb2JqZWN0IGFuZCBzcGxpY2Ugb3V0IGR1cGxpY2F0ZXMuXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlKCBsID49IDAgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCBfLm9wdGlvbnMucmVzcG9uc2l2ZVtsXS5icmVha3BvaW50ID09PSB2YWx1ZVtpdGVtXS5icmVha3BvaW50ICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5vcHRpb25zLnJlc3BvbnNpdmUuc3BsaWNlKGwsMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgbC0tO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBfLm9wdGlvbnMucmVzcG9uc2l2ZS5wdXNoKCB2YWx1ZVtpdGVtXSApO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggcmVmcmVzaCApIHtcblxuICAgICAgICAgICAgXy51bmxvYWQoKTtcbiAgICAgICAgICAgIF8ucmVpbml0KCk7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBfLnNldERpbWVuc2lvbnMoKTtcblxuICAgICAgICBfLnNldEhlaWdodCgpO1xuXG4gICAgICAgIGlmIChfLm9wdGlvbnMuZmFkZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIF8uc2V0Q1NTKF8uZ2V0TGVmdChfLmN1cnJlbnRTbGlkZSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgXy5zZXRGYWRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBfLiRzbGlkZXIudHJpZ2dlcignc2V0UG9zaXRpb24nLCBbX10pO1xuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5zZXRQcm9wcyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcyxcbiAgICAgICAgICAgIGJvZHlTdHlsZSA9IGRvY3VtZW50LmJvZHkuc3R5bGU7XG5cbiAgICAgICAgXy5wb3NpdGlvblByb3AgPSBfLm9wdGlvbnMudmVydGljYWwgPT09IHRydWUgPyAndG9wJyA6ICdsZWZ0JztcblxuICAgICAgICBpZiAoXy5wb3NpdGlvblByb3AgPT09ICd0b3AnKSB7XG4gICAgICAgICAgICBfLiRzbGlkZXIuYWRkQ2xhc3MoJ3NsaWNrLXZlcnRpY2FsJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfLiRzbGlkZXIucmVtb3ZlQ2xhc3MoJ3NsaWNrLXZlcnRpY2FsJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYm9keVN0eWxlLldlYmtpdFRyYW5zaXRpb24gIT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgICAgYm9keVN0eWxlLk1velRyYW5zaXRpb24gIT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgICAgYm9keVN0eWxlLm1zVHJhbnNpdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoXy5vcHRpb25zLnVzZUNTUyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIF8uY3NzVHJhbnNpdGlvbnMgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBfLm9wdGlvbnMuZmFkZSApIHtcbiAgICAgICAgICAgIGlmICggdHlwZW9mIF8ub3B0aW9ucy56SW5kZXggPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgICAgIGlmKCBfLm9wdGlvbnMuekluZGV4IDwgMyApIHtcbiAgICAgICAgICAgICAgICAgICAgXy5vcHRpb25zLnpJbmRleCA9IDM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBfLm9wdGlvbnMuekluZGV4ID0gXy5kZWZhdWx0cy56SW5kZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYm9keVN0eWxlLk9UcmFuc2Zvcm0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgXy5hbmltVHlwZSA9ICdPVHJhbnNmb3JtJztcbiAgICAgICAgICAgIF8udHJhbnNmb3JtVHlwZSA9ICctby10cmFuc2Zvcm0nO1xuICAgICAgICAgICAgXy50cmFuc2l0aW9uVHlwZSA9ICdPVHJhbnNpdGlvbic7XG4gICAgICAgICAgICBpZiAoYm9keVN0eWxlLnBlcnNwZWN0aXZlUHJvcGVydHkgPT09IHVuZGVmaW5lZCAmJiBib2R5U3R5bGUud2Via2l0UGVyc3BlY3RpdmUgPT09IHVuZGVmaW5lZCkgXy5hbmltVHlwZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChib2R5U3R5bGUuTW96VHJhbnNmb3JtICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIF8uYW5pbVR5cGUgPSAnTW96VHJhbnNmb3JtJztcbiAgICAgICAgICAgIF8udHJhbnNmb3JtVHlwZSA9ICctbW96LXRyYW5zZm9ybSc7XG4gICAgICAgICAgICBfLnRyYW5zaXRpb25UeXBlID0gJ01velRyYW5zaXRpb24nO1xuICAgICAgICAgICAgaWYgKGJvZHlTdHlsZS5wZXJzcGVjdGl2ZVByb3BlcnR5ID09PSB1bmRlZmluZWQgJiYgYm9keVN0eWxlLk1velBlcnNwZWN0aXZlID09PSB1bmRlZmluZWQpIF8uYW5pbVR5cGUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYm9keVN0eWxlLndlYmtpdFRyYW5zZm9ybSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBfLmFuaW1UeXBlID0gJ3dlYmtpdFRyYW5zZm9ybSc7XG4gICAgICAgICAgICBfLnRyYW5zZm9ybVR5cGUgPSAnLXdlYmtpdC10cmFuc2Zvcm0nO1xuICAgICAgICAgICAgXy50cmFuc2l0aW9uVHlwZSA9ICd3ZWJraXRUcmFuc2l0aW9uJztcbiAgICAgICAgICAgIGlmIChib2R5U3R5bGUucGVyc3BlY3RpdmVQcm9wZXJ0eSA9PT0gdW5kZWZpbmVkICYmIGJvZHlTdHlsZS53ZWJraXRQZXJzcGVjdGl2ZSA9PT0gdW5kZWZpbmVkKSBfLmFuaW1UeXBlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGJvZHlTdHlsZS5tc1RyYW5zZm9ybSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBfLmFuaW1UeXBlID0gJ21zVHJhbnNmb3JtJztcbiAgICAgICAgICAgIF8udHJhbnNmb3JtVHlwZSA9ICctbXMtdHJhbnNmb3JtJztcbiAgICAgICAgICAgIF8udHJhbnNpdGlvblR5cGUgPSAnbXNUcmFuc2l0aW9uJztcbiAgICAgICAgICAgIGlmIChib2R5U3R5bGUubXNUcmFuc2Zvcm0gPT09IHVuZGVmaW5lZCkgXy5hbmltVHlwZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChib2R5U3R5bGUudHJhbnNmb3JtICE9PSB1bmRlZmluZWQgJiYgXy5hbmltVHlwZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIF8uYW5pbVR5cGUgPSAndHJhbnNmb3JtJztcbiAgICAgICAgICAgIF8udHJhbnNmb3JtVHlwZSA9ICd0cmFuc2Zvcm0nO1xuICAgICAgICAgICAgXy50cmFuc2l0aW9uVHlwZSA9ICd0cmFuc2l0aW9uJztcbiAgICAgICAgfVxuICAgICAgICBfLnRyYW5zZm9ybXNFbmFibGVkID0gXy5vcHRpb25zLnVzZVRyYW5zZm9ybSAmJiAoXy5hbmltVHlwZSAhPT0gbnVsbCAmJiBfLmFuaW1UeXBlICE9PSBmYWxzZSk7XG4gICAgfTtcblxuXG4gICAgU2xpY2sucHJvdG90eXBlLnNldFNsaWRlQ2xhc3NlcyA9IGZ1bmN0aW9uKGluZGV4KSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzLFxuICAgICAgICAgICAgY2VudGVyT2Zmc2V0LCBhbGxTbGlkZXMsIGluZGV4T2Zmc2V0LCByZW1haW5kZXI7XG5cbiAgICAgICAgYWxsU2xpZGVzID0gXy4kc2xpZGVyXG4gICAgICAgICAgICAuZmluZCgnLnNsaWNrLXNsaWRlJylcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnc2xpY2stYWN0aXZlIHNsaWNrLWNlbnRlciBzbGljay1jdXJyZW50JylcbiAgICAgICAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG5cbiAgICAgICAgXy4kc2xpZGVzXG4gICAgICAgICAgICAuZXEoaW5kZXgpXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ3NsaWNrLWN1cnJlbnQnKTtcblxuICAgICAgICBpZiAoXy5vcHRpb25zLmNlbnRlck1vZGUgPT09IHRydWUpIHtcblxuICAgICAgICAgICAgdmFyIGV2ZW5Db2VmID0gXy5vcHRpb25zLnNsaWRlc1RvU2hvdyAlIDIgPT09IDAgPyAxIDogMDtcblxuICAgICAgICAgICAgY2VudGVyT2Zmc2V0ID0gTWF0aC5mbG9vcihfLm9wdGlvbnMuc2xpZGVzVG9TaG93IC8gMik7XG5cbiAgICAgICAgICAgIGlmIChfLm9wdGlvbnMuaW5maW5pdGUgPT09IHRydWUpIHtcblxuICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSBjZW50ZXJPZmZzZXQgJiYgaW5kZXggPD0gKF8uc2xpZGVDb3VudCAtIDEpIC0gY2VudGVyT2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIF8uJHNsaWRlc1xuICAgICAgICAgICAgICAgICAgICAgICAgLnNsaWNlKGluZGV4IC0gY2VudGVyT2Zmc2V0ICsgZXZlbkNvZWYsIGluZGV4ICsgY2VudGVyT2Zmc2V0ICsgMSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnc2xpY2stYWN0aXZlJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICBpbmRleE9mZnNldCA9IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cgKyBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgYWxsU2xpZGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoaW5kZXhPZmZzZXQgLSBjZW50ZXJPZmZzZXQgKyAxICsgZXZlbkNvZWYsIGluZGV4T2Zmc2V0ICsgY2VudGVyT2Zmc2V0ICsgMilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnc2xpY2stYWN0aXZlJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgYWxsU2xpZGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAuZXEoYWxsU2xpZGVzLmxlbmd0aCAtIDEgLSBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdzbGljay1jZW50ZXInKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5kZXggPT09IF8uc2xpZGVDb3VudCAtIDEpIHtcblxuICAgICAgICAgICAgICAgICAgICBhbGxTbGlkZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcShfLm9wdGlvbnMuc2xpZGVzVG9TaG93KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdzbGljay1jZW50ZXInKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfLiRzbGlkZXNcbiAgICAgICAgICAgICAgICAuZXEoaW5kZXgpXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKCdzbGljay1jZW50ZXInKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gMCAmJiBpbmRleCA8PSAoXy5zbGlkZUNvdW50IC0gXy5vcHRpb25zLnNsaWRlc1RvU2hvdykpIHtcblxuICAgICAgICAgICAgICAgIF8uJHNsaWRlc1xuICAgICAgICAgICAgICAgICAgICAuc2xpY2UoaW5kZXgsIGluZGV4ICsgXy5vcHRpb25zLnNsaWRlc1RvU2hvdylcbiAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdzbGljay1hY3RpdmUnKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmIChhbGxTbGlkZXMubGVuZ3RoIDw9IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cpIHtcblxuICAgICAgICAgICAgICAgIGFsbFNsaWRlc1xuICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3NsaWNrLWFjdGl2ZScpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgcmVtYWluZGVyID0gXy5zbGlkZUNvdW50ICUgXy5vcHRpb25zLnNsaWRlc1RvU2hvdztcbiAgICAgICAgICAgICAgICBpbmRleE9mZnNldCA9IF8ub3B0aW9ucy5pbmZpbml0ZSA9PT0gdHJ1ZSA/IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cgKyBpbmRleCA6IGluZGV4O1xuXG4gICAgICAgICAgICAgICAgaWYgKF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cgPT0gXy5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsICYmIChfLnNsaWRlQ291bnQgLSBpbmRleCkgPCBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KSB7XG5cbiAgICAgICAgICAgICAgICAgICAgYWxsU2xpZGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2xpY2UoaW5kZXhPZmZzZXQgLSAoXy5vcHRpb25zLnNsaWRlc1RvU2hvdyAtIHJlbWFpbmRlciksIGluZGV4T2Zmc2V0ICsgcmVtYWluZGVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdzbGljay1hY3RpdmUnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIGFsbFNsaWRlc1xuICAgICAgICAgICAgICAgICAgICAgICAgLnNsaWNlKGluZGV4T2Zmc2V0LCBpbmRleE9mZnNldCArIF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3NsaWNrLWFjdGl2ZScpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5vcHRpb25zLmxhenlMb2FkID09PSAnb25kZW1hbmQnIHx8IF8ub3B0aW9ucy5sYXp5TG9hZCA9PT0gJ2FudGljaXBhdGVkJykge1xuICAgICAgICAgICAgXy5sYXp5TG9hZCgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5zZXR1cEluZmluaXRlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzLFxuICAgICAgICAgICAgaSwgc2xpZGVJbmRleCwgaW5maW5pdGVDb3VudDtcblxuICAgICAgICBpZiAoXy5vcHRpb25zLmZhZGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgIF8ub3B0aW9ucy5jZW50ZXJNb2RlID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5vcHRpb25zLmluZmluaXRlID09PSB0cnVlICYmIF8ub3B0aW9ucy5mYWRlID09PSBmYWxzZSkge1xuXG4gICAgICAgICAgICBzbGlkZUluZGV4ID0gbnVsbDtcblxuICAgICAgICAgICAgaWYgKF8uc2xpZGVDb3VudCA+IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cpIHtcblxuICAgICAgICAgICAgICAgIGlmIChfLm9wdGlvbnMuY2VudGVyTW9kZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpbmZpbml0ZUNvdW50ID0gXy5vcHRpb25zLnNsaWRlc1RvU2hvdyArIDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5maW5pdGVDb3VudCA9IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3c7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gXy5zbGlkZUNvdW50OyBpID4gKF8uc2xpZGVDb3VudCAtXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZpbml0ZUNvdW50KTsgaSAtPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHNsaWRlSW5kZXggPSBpIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgJChfLiRzbGlkZXNbc2xpZGVJbmRleF0pLmNsb25lKHRydWUpLmF0dHIoJ2lkJywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignZGF0YS1zbGljay1pbmRleCcsIHNsaWRlSW5kZXggLSBfLnNsaWRlQ291bnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAucHJlcGVuZFRvKF8uJHNsaWRlVHJhY2spLmFkZENsYXNzKCdzbGljay1jbG9uZWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGluZmluaXRlQ291bnQgICsgXy5zbGlkZUNvdW50OyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVJbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICQoXy4kc2xpZGVzW3NsaWRlSW5kZXhdKS5jbG9uZSh0cnVlKS5hdHRyKCdpZCcsICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGEtc2xpY2staW5kZXgnLCBzbGlkZUluZGV4ICsgXy5zbGlkZUNvdW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZFRvKF8uJHNsaWRlVHJhY2spLmFkZENsYXNzKCdzbGljay1jbG9uZWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXy4kc2xpZGVUcmFjay5maW5kKCcuc2xpY2stY2xvbmVkJykuZmluZCgnW2lkXScpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYXR0cignaWQnLCAnJyk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLmludGVycnVwdCA9IGZ1bmN0aW9uKCB0b2dnbGUgKSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzO1xuXG4gICAgICAgIGlmKCAhdG9nZ2xlICkge1xuICAgICAgICAgICAgXy5hdXRvUGxheSgpO1xuICAgICAgICB9XG4gICAgICAgIF8uaW50ZXJydXB0ZWQgPSB0b2dnbGU7XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLnNlbGVjdEhhbmRsZXIgPSBmdW5jdGlvbihldmVudCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICB2YXIgdGFyZ2V0RWxlbWVudCA9XG4gICAgICAgICAgICAkKGV2ZW50LnRhcmdldCkuaXMoJy5zbGljay1zbGlkZScpID9cbiAgICAgICAgICAgICAgICAkKGV2ZW50LnRhcmdldCkgOlxuICAgICAgICAgICAgICAgICQoZXZlbnQudGFyZ2V0KS5wYXJlbnRzKCcuc2xpY2stc2xpZGUnKTtcblxuICAgICAgICB2YXIgaW5kZXggPSBwYXJzZUludCh0YXJnZXRFbGVtZW50LmF0dHIoJ2RhdGEtc2xpY2staW5kZXgnKSk7XG5cbiAgICAgICAgaWYgKCFpbmRleCkgaW5kZXggPSAwO1xuXG4gICAgICAgIGlmIChfLnNsaWRlQ291bnQgPD0gXy5vcHRpb25zLnNsaWRlc1RvU2hvdykge1xuXG4gICAgICAgICAgICBfLnNsaWRlSGFuZGxlcihpbmRleCwgZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIH1cblxuICAgICAgICBfLnNsaWRlSGFuZGxlcihpbmRleCk7XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLnNsaWRlSGFuZGxlciA9IGZ1bmN0aW9uKGluZGV4LCBzeW5jLCBkb250QW5pbWF0ZSkge1xuXG4gICAgICAgIHZhciB0YXJnZXRTbGlkZSwgYW5pbVNsaWRlLCBvbGRTbGlkZSwgc2xpZGVMZWZ0LCB0YXJnZXRMZWZ0ID0gbnVsbCxcbiAgICAgICAgICAgIF8gPSB0aGlzLCBuYXZUYXJnZXQ7XG5cbiAgICAgICAgc3luYyA9IHN5bmMgfHwgZmFsc2U7XG5cbiAgICAgICAgaWYgKF8uYW5pbWF0aW5nID09PSB0cnVlICYmIF8ub3B0aW9ucy53YWl0Rm9yQW5pbWF0ZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5mYWRlID09PSB0cnVlICYmIF8uY3VycmVudFNsaWRlID09PSBpbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN5bmMgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBfLmFzTmF2Rm9yKGluZGV4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRhcmdldFNsaWRlID0gaW5kZXg7XG4gICAgICAgIHRhcmdldExlZnQgPSBfLmdldExlZnQodGFyZ2V0U2xpZGUpO1xuICAgICAgICBzbGlkZUxlZnQgPSBfLmdldExlZnQoXy5jdXJyZW50U2xpZGUpO1xuXG4gICAgICAgIF8uY3VycmVudExlZnQgPSBfLnN3aXBlTGVmdCA9PT0gbnVsbCA/IHNsaWRlTGVmdCA6IF8uc3dpcGVMZWZ0O1xuXG4gICAgICAgIGlmIChfLm9wdGlvbnMuaW5maW5pdGUgPT09IGZhbHNlICYmIF8ub3B0aW9ucy5jZW50ZXJNb2RlID09PSBmYWxzZSAmJiAoaW5kZXggPCAwIHx8IGluZGV4ID4gXy5nZXREb3RDb3VudCgpICogXy5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsKSkge1xuICAgICAgICAgICAgaWYgKF8ub3B0aW9ucy5mYWRlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHRhcmdldFNsaWRlID0gXy5jdXJyZW50U2xpZGU7XG4gICAgICAgICAgICAgICAgaWYgKGRvbnRBbmltYXRlICE9PSB0cnVlICYmIF8uc2xpZGVDb3VudCA+IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cpIHtcbiAgICAgICAgICAgICAgICAgICAgXy5hbmltYXRlU2xpZGUoc2xpZGVMZWZ0LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF8ucG9zdFNsaWRlKHRhcmdldFNsaWRlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgXy5wb3N0U2xpZGUodGFyZ2V0U2xpZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIGlmIChfLm9wdGlvbnMuaW5maW5pdGUgPT09IGZhbHNlICYmIF8ub3B0aW9ucy5jZW50ZXJNb2RlID09PSB0cnVlICYmIChpbmRleCA8IDAgfHwgaW5kZXggPiAoXy5zbGlkZUNvdW50IC0gXy5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsKSkpIHtcbiAgICAgICAgICAgIGlmIChfLm9wdGlvbnMuZmFkZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRTbGlkZSA9IF8uY3VycmVudFNsaWRlO1xuICAgICAgICAgICAgICAgIGlmIChkb250QW5pbWF0ZSAhPT0gdHJ1ZSAmJiBfLnNsaWRlQ291bnQgPiBfLm9wdGlvbnMuc2xpZGVzVG9TaG93KSB7XG4gICAgICAgICAgICAgICAgICAgIF8uYW5pbWF0ZVNsaWRlKHNsaWRlTGVmdCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfLnBvc3RTbGlkZSh0YXJnZXRTbGlkZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIF8ucG9zdFNsaWRlKHRhcmdldFNsaWRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIF8ub3B0aW9ucy5hdXRvcGxheSApIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoXy5hdXRvUGxheVRpbWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0YXJnZXRTbGlkZSA8IDApIHtcbiAgICAgICAgICAgIGlmIChfLnNsaWRlQ291bnQgJSBfLm9wdGlvbnMuc2xpZGVzVG9TY3JvbGwgIT09IDApIHtcbiAgICAgICAgICAgICAgICBhbmltU2xpZGUgPSBfLnNsaWRlQ291bnQgLSAoXy5zbGlkZUNvdW50ICUgXy5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYW5pbVNsaWRlID0gXy5zbGlkZUNvdW50ICsgdGFyZ2V0U2xpZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0U2xpZGUgPj0gXy5zbGlkZUNvdW50KSB7XG4gICAgICAgICAgICBpZiAoXy5zbGlkZUNvdW50ICUgXy5vcHRpb25zLnNsaWRlc1RvU2Nyb2xsICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgYW5pbVNsaWRlID0gMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYW5pbVNsaWRlID0gdGFyZ2V0U2xpZGUgLSBfLnNsaWRlQ291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhbmltU2xpZGUgPSB0YXJnZXRTbGlkZTtcbiAgICAgICAgfVxuXG4gICAgICAgIF8uYW5pbWF0aW5nID0gdHJ1ZTtcblxuICAgICAgICBfLiRzbGlkZXIudHJpZ2dlcignYmVmb3JlQ2hhbmdlJywgW18sIF8uY3VycmVudFNsaWRlLCBhbmltU2xpZGVdKTtcblxuICAgICAgICBvbGRTbGlkZSA9IF8uY3VycmVudFNsaWRlO1xuICAgICAgICBfLmN1cnJlbnRTbGlkZSA9IGFuaW1TbGlkZTtcblxuICAgICAgICBfLnNldFNsaWRlQ2xhc3NlcyhfLmN1cnJlbnRTbGlkZSk7XG5cbiAgICAgICAgaWYgKCBfLm9wdGlvbnMuYXNOYXZGb3IgKSB7XG5cbiAgICAgICAgICAgIG5hdlRhcmdldCA9IF8uZ2V0TmF2VGFyZ2V0KCk7XG4gICAgICAgICAgICBuYXZUYXJnZXQgPSBuYXZUYXJnZXQuc2xpY2soJ2dldFNsaWNrJyk7XG5cbiAgICAgICAgICAgIGlmICggbmF2VGFyZ2V0LnNsaWRlQ291bnQgPD0gbmF2VGFyZ2V0Lm9wdGlvbnMuc2xpZGVzVG9TaG93ICkge1xuICAgICAgICAgICAgICAgIG5hdlRhcmdldC5zZXRTbGlkZUNsYXNzZXMoXy5jdXJyZW50U2xpZGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICBfLnVwZGF0ZURvdHMoKTtcbiAgICAgICAgXy51cGRhdGVBcnJvd3MoKTtcblxuICAgICAgICBpZiAoXy5vcHRpb25zLmZhZGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGlmIChkb250QW5pbWF0ZSAhPT0gdHJ1ZSkge1xuXG4gICAgICAgICAgICAgICAgXy5mYWRlU2xpZGVPdXQob2xkU2xpZGUpO1xuXG4gICAgICAgICAgICAgICAgXy5mYWRlU2xpZGUoYW5pbVNsaWRlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgXy5wb3N0U2xpZGUoYW5pbVNsaWRlKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBfLnBvc3RTbGlkZShhbmltU2xpZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXy5hbmltYXRlSGVpZ2h0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG9udEFuaW1hdGUgIT09IHRydWUgJiYgXy5zbGlkZUNvdW50ID4gXy5vcHRpb25zLnNsaWRlc1RvU2hvdykge1xuICAgICAgICAgICAgXy5hbmltYXRlU2xpZGUodGFyZ2V0TGVmdCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgXy5wb3N0U2xpZGUoYW5pbVNsaWRlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgXy5wb3N0U2xpZGUoYW5pbVNsaWRlKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5zdGFydExvYWQgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5hcnJvd3MgPT09IHRydWUgJiYgXy5zbGlkZUNvdW50ID4gXy5vcHRpb25zLnNsaWRlc1RvU2hvdykge1xuXG4gICAgICAgICAgICBfLiRwcmV2QXJyb3cuaGlkZSgpO1xuICAgICAgICAgICAgXy4kbmV4dEFycm93LmhpZGUoKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5kb3RzID09PSB0cnVlICYmIF8uc2xpZGVDb3VudCA+IF8ub3B0aW9ucy5zbGlkZXNUb1Nob3cpIHtcblxuICAgICAgICAgICAgXy4kZG90cy5oaWRlKCk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIF8uJHNsaWRlci5hZGRDbGFzcygnc2xpY2stbG9hZGluZycpO1xuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5zd2lwZURpcmVjdGlvbiA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciB4RGlzdCwgeURpc3QsIHIsIHN3aXBlQW5nbGUsIF8gPSB0aGlzO1xuXG4gICAgICAgIHhEaXN0ID0gXy50b3VjaE9iamVjdC5zdGFydFggLSBfLnRvdWNoT2JqZWN0LmN1clg7XG4gICAgICAgIHlEaXN0ID0gXy50b3VjaE9iamVjdC5zdGFydFkgLSBfLnRvdWNoT2JqZWN0LmN1clk7XG4gICAgICAgIHIgPSBNYXRoLmF0YW4yKHlEaXN0LCB4RGlzdCk7XG5cbiAgICAgICAgc3dpcGVBbmdsZSA9IE1hdGgucm91bmQociAqIDE4MCAvIE1hdGguUEkpO1xuICAgICAgICBpZiAoc3dpcGVBbmdsZSA8IDApIHtcbiAgICAgICAgICAgIHN3aXBlQW5nbGUgPSAzNjAgLSBNYXRoLmFicyhzd2lwZUFuZ2xlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoc3dpcGVBbmdsZSA8PSA0NSkgJiYgKHN3aXBlQW5nbGUgPj0gMCkpIHtcbiAgICAgICAgICAgIHJldHVybiAoXy5vcHRpb25zLnJ0bCA9PT0gZmFsc2UgPyAnbGVmdCcgOiAncmlnaHQnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHN3aXBlQW5nbGUgPD0gMzYwKSAmJiAoc3dpcGVBbmdsZSA+PSAzMTUpKSB7XG4gICAgICAgICAgICByZXR1cm4gKF8ub3B0aW9ucy5ydGwgPT09IGZhbHNlID8gJ2xlZnQnIDogJ3JpZ2h0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKChzd2lwZUFuZ2xlID49IDEzNSkgJiYgKHN3aXBlQW5nbGUgPD0gMjI1KSkge1xuICAgICAgICAgICAgcmV0dXJuIChfLm9wdGlvbnMucnRsID09PSBmYWxzZSA/ICdyaWdodCcgOiAnbGVmdCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLm9wdGlvbnMudmVydGljYWxTd2lwaW5nID09PSB0cnVlKSB7XG4gICAgICAgICAgICBpZiAoKHN3aXBlQW5nbGUgPj0gMzUpICYmIChzd2lwZUFuZ2xlIDw9IDEzNSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2Rvd24nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3VwJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAndmVydGljYWwnO1xuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5zd2lwZUVuZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzLFxuICAgICAgICAgICAgc2xpZGVDb3VudCxcbiAgICAgICAgICAgIGRpcmVjdGlvbjtcblxuICAgICAgICBfLmRyYWdnaW5nID0gZmFsc2U7XG4gICAgICAgIF8uc3dpcGluZyA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChfLnNjcm9sbGluZykge1xuICAgICAgICAgICAgXy5zY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIF8uaW50ZXJydXB0ZWQgPSBmYWxzZTtcbiAgICAgICAgXy5zaG91bGRDbGljayA9ICggXy50b3VjaE9iamVjdC5zd2lwZUxlbmd0aCA+IDEwICkgPyBmYWxzZSA6IHRydWU7XG5cbiAgICAgICAgaWYgKCBfLnRvdWNoT2JqZWN0LmN1clggPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggXy50b3VjaE9iamVjdC5lZGdlSGl0ID09PSB0cnVlICkge1xuICAgICAgICAgICAgXy4kc2xpZGVyLnRyaWdnZXIoJ2VkZ2UnLCBbXywgXy5zd2lwZURpcmVjdGlvbigpIF0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBfLnRvdWNoT2JqZWN0LnN3aXBlTGVuZ3RoID49IF8udG91Y2hPYmplY3QubWluU3dpcGUgKSB7XG5cbiAgICAgICAgICAgIGRpcmVjdGlvbiA9IF8uc3dpcGVEaXJlY3Rpb24oKTtcblxuICAgICAgICAgICAgc3dpdGNoICggZGlyZWN0aW9uICkge1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgICAgICAgY2FzZSAnZG93bic6XG5cbiAgICAgICAgICAgICAgICAgICAgc2xpZGVDb3VudCA9XG4gICAgICAgICAgICAgICAgICAgICAgICBfLm9wdGlvbnMuc3dpcGVUb1NsaWRlID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmNoZWNrTmF2aWdhYmxlKCBfLmN1cnJlbnRTbGlkZSArIF8uZ2V0U2xpZGVDb3VudCgpICkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uY3VycmVudFNsaWRlICsgXy5nZXRTbGlkZUNvdW50KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgXy5jdXJyZW50RGlyZWN0aW9uID0gMDtcblxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICAgICAgICBjYXNlICd1cCc6XG5cbiAgICAgICAgICAgICAgICAgICAgc2xpZGVDb3VudCA9XG4gICAgICAgICAgICAgICAgICAgICAgICBfLm9wdGlvbnMuc3dpcGVUb1NsaWRlID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmNoZWNrTmF2aWdhYmxlKCBfLmN1cnJlbnRTbGlkZSAtIF8uZ2V0U2xpZGVDb3VudCgpICkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uY3VycmVudFNsaWRlIC0gXy5nZXRTbGlkZUNvdW50KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgXy5jdXJyZW50RGlyZWN0aW9uID0gMTtcblxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG5cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiggZGlyZWN0aW9uICE9ICd2ZXJ0aWNhbCcgKSB7XG5cbiAgICAgICAgICAgICAgICBfLnNsaWRlSGFuZGxlciggc2xpZGVDb3VudCApO1xuICAgICAgICAgICAgICAgIF8udG91Y2hPYmplY3QgPSB7fTtcbiAgICAgICAgICAgICAgICBfLiRzbGlkZXIudHJpZ2dlcignc3dpcGUnLCBbXywgZGlyZWN0aW9uIF0pO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgaWYgKCBfLnRvdWNoT2JqZWN0LnN0YXJ0WCAhPT0gXy50b3VjaE9iamVjdC5jdXJYICkge1xuXG4gICAgICAgICAgICAgICAgXy5zbGlkZUhhbmRsZXIoIF8uY3VycmVudFNsaWRlICk7XG4gICAgICAgICAgICAgICAgXy50b3VjaE9iamVjdCA9IHt9O1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS5zd2lwZUhhbmRsZXIgPSBmdW5jdGlvbihldmVudCkge1xuXG4gICAgICAgIHZhciBfID0gdGhpcztcblxuICAgICAgICBpZiAoKF8ub3B0aW9ucy5zd2lwZSA9PT0gZmFsc2UpIHx8ICgnb250b3VjaGVuZCcgaW4gZG9jdW1lbnQgJiYgXy5vcHRpb25zLnN3aXBlID09PSBmYWxzZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIGlmIChfLm9wdGlvbnMuZHJhZ2dhYmxlID09PSBmYWxzZSAmJiBldmVudC50eXBlLmluZGV4T2YoJ21vdXNlJykgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBfLnRvdWNoT2JqZWN0LmZpbmdlckNvdW50ID0gZXZlbnQub3JpZ2luYWxFdmVudCAmJiBldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXMgIT09IHVuZGVmaW5lZCA/XG4gICAgICAgICAgICBldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXMubGVuZ3RoIDogMTtcblxuICAgICAgICBfLnRvdWNoT2JqZWN0Lm1pblN3aXBlID0gXy5saXN0V2lkdGggLyBfLm9wdGlvbnNcbiAgICAgICAgICAgIC50b3VjaFRocmVzaG9sZDtcblxuICAgICAgICBpZiAoXy5vcHRpb25zLnZlcnRpY2FsU3dpcGluZyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgXy50b3VjaE9iamVjdC5taW5Td2lwZSA9IF8ubGlzdEhlaWdodCAvIF8ub3B0aW9uc1xuICAgICAgICAgICAgICAgIC50b3VjaFRocmVzaG9sZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAoZXZlbnQuZGF0YS5hY3Rpb24pIHtcblxuICAgICAgICAgICAgY2FzZSAnc3RhcnQnOlxuICAgICAgICAgICAgICAgIF8uc3dpcGVTdGFydChldmVudCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ21vdmUnOlxuICAgICAgICAgICAgICAgIF8uc3dpcGVNb3ZlKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZW5kJzpcbiAgICAgICAgICAgICAgICBfLnN3aXBlRW5kKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLnN3aXBlTW92ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzLFxuICAgICAgICAgICAgZWRnZVdhc0hpdCA9IGZhbHNlLFxuICAgICAgICAgICAgY3VyTGVmdCwgc3dpcGVEaXJlY3Rpb24sIHN3aXBlTGVuZ3RoLCBwb3NpdGlvbk9mZnNldCwgdG91Y2hlcywgdmVydGljYWxTd2lwZUxlbmd0aDtcblxuICAgICAgICB0b3VjaGVzID0gZXZlbnQub3JpZ2luYWxFdmVudCAhPT0gdW5kZWZpbmVkID8gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzIDogbnVsbDtcblxuICAgICAgICBpZiAoIV8uZHJhZ2dpbmcgfHwgXy5zY3JvbGxpbmcgfHwgdG91Y2hlcyAmJiB0b3VjaGVzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY3VyTGVmdCA9IF8uZ2V0TGVmdChfLmN1cnJlbnRTbGlkZSk7XG5cbiAgICAgICAgXy50b3VjaE9iamVjdC5jdXJYID0gdG91Y2hlcyAhPT0gdW5kZWZpbmVkID8gdG91Y2hlc1swXS5wYWdlWCA6IGV2ZW50LmNsaWVudFg7XG4gICAgICAgIF8udG91Y2hPYmplY3QuY3VyWSA9IHRvdWNoZXMgIT09IHVuZGVmaW5lZCA/IHRvdWNoZXNbMF0ucGFnZVkgOiBldmVudC5jbGllbnRZO1xuXG4gICAgICAgIF8udG91Y2hPYmplY3Quc3dpcGVMZW5ndGggPSBNYXRoLnJvdW5kKE1hdGguc3FydChcbiAgICAgICAgICAgIE1hdGgucG93KF8udG91Y2hPYmplY3QuY3VyWCAtIF8udG91Y2hPYmplY3Quc3RhcnRYLCAyKSkpO1xuXG4gICAgICAgIHZlcnRpY2FsU3dpcGVMZW5ndGggPSBNYXRoLnJvdW5kKE1hdGguc3FydChcbiAgICAgICAgICAgIE1hdGgucG93KF8udG91Y2hPYmplY3QuY3VyWSAtIF8udG91Y2hPYmplY3Quc3RhcnRZLCAyKSkpO1xuXG4gICAgICAgIGlmICghXy5vcHRpb25zLnZlcnRpY2FsU3dpcGluZyAmJiAhXy5zd2lwaW5nICYmIHZlcnRpY2FsU3dpcGVMZW5ndGggPiA0KSB7XG4gICAgICAgICAgICBfLnNjcm9sbGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5vcHRpb25zLnZlcnRpY2FsU3dpcGluZyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgXy50b3VjaE9iamVjdC5zd2lwZUxlbmd0aCA9IHZlcnRpY2FsU3dpcGVMZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICBzd2lwZURpcmVjdGlvbiA9IF8uc3dpcGVEaXJlY3Rpb24oKTtcblxuICAgICAgICBpZiAoZXZlbnQub3JpZ2luYWxFdmVudCAhPT0gdW5kZWZpbmVkICYmIF8udG91Y2hPYmplY3Quc3dpcGVMZW5ndGggPiA0KSB7XG4gICAgICAgICAgICBfLnN3aXBpbmcgPSB0cnVlO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBvc2l0aW9uT2Zmc2V0ID0gKF8ub3B0aW9ucy5ydGwgPT09IGZhbHNlID8gMSA6IC0xKSAqIChfLnRvdWNoT2JqZWN0LmN1clggPiBfLnRvdWNoT2JqZWN0LnN0YXJ0WCA/IDEgOiAtMSk7XG4gICAgICAgIGlmIChfLm9wdGlvbnMudmVydGljYWxTd2lwaW5nID09PSB0cnVlKSB7XG4gICAgICAgICAgICBwb3NpdGlvbk9mZnNldCA9IF8udG91Y2hPYmplY3QuY3VyWSA+IF8udG91Y2hPYmplY3Quc3RhcnRZID8gMSA6IC0xO1xuICAgICAgICB9XG5cblxuICAgICAgICBzd2lwZUxlbmd0aCA9IF8udG91Y2hPYmplY3Quc3dpcGVMZW5ndGg7XG5cbiAgICAgICAgXy50b3VjaE9iamVjdC5lZGdlSGl0ID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5pbmZpbml0ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGlmICgoXy5jdXJyZW50U2xpZGUgPT09IDAgJiYgc3dpcGVEaXJlY3Rpb24gPT09ICdyaWdodCcpIHx8IChfLmN1cnJlbnRTbGlkZSA+PSBfLmdldERvdENvdW50KCkgJiYgc3dpcGVEaXJlY3Rpb24gPT09ICdsZWZ0JykpIHtcbiAgICAgICAgICAgICAgICBzd2lwZUxlbmd0aCA9IF8udG91Y2hPYmplY3Quc3dpcGVMZW5ndGggKiBfLm9wdGlvbnMuZWRnZUZyaWN0aW9uO1xuICAgICAgICAgICAgICAgIF8udG91Y2hPYmplY3QuZWRnZUhpdCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5vcHRpb25zLnZlcnRpY2FsID09PSBmYWxzZSkge1xuICAgICAgICAgICAgXy5zd2lwZUxlZnQgPSBjdXJMZWZ0ICsgc3dpcGVMZW5ndGggKiBwb3NpdGlvbk9mZnNldDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF8uc3dpcGVMZWZ0ID0gY3VyTGVmdCArIChzd2lwZUxlbmd0aCAqIChfLiRsaXN0LmhlaWdodCgpIC8gXy5saXN0V2lkdGgpKSAqIHBvc2l0aW9uT2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChfLm9wdGlvbnMudmVydGljYWxTd2lwaW5nID09PSB0cnVlKSB7XG4gICAgICAgICAgICBfLnN3aXBlTGVmdCA9IGN1ckxlZnQgKyBzd2lwZUxlbmd0aCAqIHBvc2l0aW9uT2Zmc2V0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8ub3B0aW9ucy5mYWRlID09PSB0cnVlIHx8IF8ub3B0aW9ucy50b3VjaE1vdmUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy5hbmltYXRpbmcgPT09IHRydWUpIHtcbiAgICAgICAgICAgIF8uc3dpcGVMZWZ0ID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIF8uc2V0Q1NTKF8uc3dpcGVMZWZ0KTtcblxuICAgIH07XG5cbiAgICBTbGljay5wcm90b3R5cGUuc3dpcGVTdGFydCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cbiAgICAgICAgdmFyIF8gPSB0aGlzLFxuICAgICAgICAgICAgdG91Y2hlcztcblxuICAgICAgICBfLmludGVycnVwdGVkID0gdHJ1ZTtcblxuICAgICAgICBpZiAoXy50b3VjaE9iamVjdC5maW5nZXJDb3VudCAhPT0gMSB8fCBfLnNsaWRlQ291bnQgPD0gXy5vcHRpb25zLnNsaWRlc1RvU2hvdykge1xuICAgICAgICAgICAgXy50b3VjaE9iamVjdCA9IHt9O1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50Lm9yaWdpbmFsRXZlbnQgIT09IHVuZGVmaW5lZCAmJiBldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdG91Y2hlcyA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlc1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIF8udG91Y2hPYmplY3Quc3RhcnRYID0gXy50b3VjaE9iamVjdC5jdXJYID0gdG91Y2hlcyAhPT0gdW5kZWZpbmVkID8gdG91Y2hlcy5wYWdlWCA6IGV2ZW50LmNsaWVudFg7XG4gICAgICAgIF8udG91Y2hPYmplY3Quc3RhcnRZID0gXy50b3VjaE9iamVjdC5jdXJZID0gdG91Y2hlcyAhPT0gdW5kZWZpbmVkID8gdG91Y2hlcy5wYWdlWSA6IGV2ZW50LmNsaWVudFk7XG5cbiAgICAgICAgXy5kcmFnZ2luZyA9IHRydWU7XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLnVuZmlsdGVyU2xpZGVzID0gU2xpY2sucHJvdG90eXBlLnNsaWNrVW5maWx0ZXIgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKF8uJHNsaWRlc0NhY2hlICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgIF8udW5sb2FkKCk7XG5cbiAgICAgICAgICAgIF8uJHNsaWRlVHJhY2suY2hpbGRyZW4odGhpcy5vcHRpb25zLnNsaWRlKS5kZXRhY2goKTtcblxuICAgICAgICAgICAgXy4kc2xpZGVzQ2FjaGUuYXBwZW5kVG8oXy4kc2xpZGVUcmFjayk7XG5cbiAgICAgICAgICAgIF8ucmVpbml0KCk7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS51bmxvYWQgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgJCgnLnNsaWNrLWNsb25lZCcsIF8uJHNsaWRlcikucmVtb3ZlKCk7XG5cbiAgICAgICAgaWYgKF8uJGRvdHMpIHtcbiAgICAgICAgICAgIF8uJGRvdHMucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXy4kcHJldkFycm93ICYmIF8uaHRtbEV4cHIudGVzdChfLm9wdGlvbnMucHJldkFycm93KSkge1xuICAgICAgICAgICAgXy4kcHJldkFycm93LnJlbW92ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF8uJG5leHRBcnJvdyAmJiBfLmh0bWxFeHByLnRlc3QoXy5vcHRpb25zLm5leHRBcnJvdykpIHtcbiAgICAgICAgICAgIF8uJG5leHRBcnJvdy5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF8uJHNsaWRlc1xuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdzbGljay1zbGlkZSBzbGljay1hY3RpdmUgc2xpY2stdmlzaWJsZSBzbGljay1jdXJyZW50JylcbiAgICAgICAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJylcbiAgICAgICAgICAgIC5jc3MoJ3dpZHRoJywgJycpO1xuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS51bnNsaWNrID0gZnVuY3Rpb24oZnJvbUJyZWFrcG9pbnQpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG4gICAgICAgIF8uJHNsaWRlci50cmlnZ2VyKCd1bnNsaWNrJywgW18sIGZyb21CcmVha3BvaW50XSk7XG4gICAgICAgIF8uZGVzdHJveSgpO1xuXG4gICAgfTtcblxuICAgIFNsaWNrLnByb3RvdHlwZS51cGRhdGVBcnJvd3MgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXMsXG4gICAgICAgICAgICBjZW50ZXJPZmZzZXQ7XG5cbiAgICAgICAgY2VudGVyT2Zmc2V0ID0gTWF0aC5mbG9vcihfLm9wdGlvbnMuc2xpZGVzVG9TaG93IC8gMik7XG5cbiAgICAgICAgaWYgKCBfLm9wdGlvbnMuYXJyb3dzID09PSB0cnVlICYmXG4gICAgICAgICAgICBfLnNsaWRlQ291bnQgPiBfLm9wdGlvbnMuc2xpZGVzVG9TaG93ICYmXG4gICAgICAgICAgICAhXy5vcHRpb25zLmluZmluaXRlICkge1xuXG4gICAgICAgICAgICBfLiRwcmV2QXJyb3cucmVtb3ZlQ2xhc3MoJ3NsaWNrLWRpc2FibGVkJykuYXR0cignYXJpYS1kaXNhYmxlZCcsICdmYWxzZScpO1xuICAgICAgICAgICAgXy4kbmV4dEFycm93LnJlbW92ZUNsYXNzKCdzbGljay1kaXNhYmxlZCcpLmF0dHIoJ2FyaWEtZGlzYWJsZWQnLCAnZmFsc2UnKTtcblxuICAgICAgICAgICAgaWYgKF8uY3VycmVudFNsaWRlID09PSAwKSB7XG5cbiAgICAgICAgICAgICAgICBfLiRwcmV2QXJyb3cuYWRkQ2xhc3MoJ3NsaWNrLWRpc2FibGVkJykuYXR0cignYXJpYS1kaXNhYmxlZCcsICd0cnVlJyk7XG4gICAgICAgICAgICAgICAgXy4kbmV4dEFycm93LnJlbW92ZUNsYXNzKCdzbGljay1kaXNhYmxlZCcpLmF0dHIoJ2FyaWEtZGlzYWJsZWQnLCAnZmFsc2UnKTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmIChfLmN1cnJlbnRTbGlkZSA+PSBfLnNsaWRlQ291bnQgLSBfLm9wdGlvbnMuc2xpZGVzVG9TaG93ICYmIF8ub3B0aW9ucy5jZW50ZXJNb2RlID09PSBmYWxzZSkge1xuXG4gICAgICAgICAgICAgICAgXy4kbmV4dEFycm93LmFkZENsYXNzKCdzbGljay1kaXNhYmxlZCcpLmF0dHIoJ2FyaWEtZGlzYWJsZWQnLCAndHJ1ZScpO1xuICAgICAgICAgICAgICAgIF8uJHByZXZBcnJvdy5yZW1vdmVDbGFzcygnc2xpY2stZGlzYWJsZWQnKS5hdHRyKCdhcmlhLWRpc2FibGVkJywgJ2ZhbHNlJyk7XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXy5jdXJyZW50U2xpZGUgPj0gXy5zbGlkZUNvdW50IC0gMSAmJiBfLm9wdGlvbnMuY2VudGVyTW9kZSA9PT0gdHJ1ZSkge1xuXG4gICAgICAgICAgICAgICAgXy4kbmV4dEFycm93LmFkZENsYXNzKCdzbGljay1kaXNhYmxlZCcpLmF0dHIoJ2FyaWEtZGlzYWJsZWQnLCAndHJ1ZScpO1xuICAgICAgICAgICAgICAgIF8uJHByZXZBcnJvdy5yZW1vdmVDbGFzcygnc2xpY2stZGlzYWJsZWQnKS5hdHRyKCdhcmlhLWRpc2FibGVkJywgJ2ZhbHNlJyk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLnVwZGF0ZURvdHMgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKF8uJGRvdHMgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgXy4kZG90c1xuICAgICAgICAgICAgICAgIC5maW5kKCdsaScpXG4gICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnc2xpY2stYWN0aXZlJylcbiAgICAgICAgICAgICAgICAgICAgLmVuZCgpO1xuXG4gICAgICAgICAgICBfLiRkb3RzXG4gICAgICAgICAgICAgICAgLmZpbmQoJ2xpJylcbiAgICAgICAgICAgICAgICAuZXEoTWF0aC5mbG9vcihfLmN1cnJlbnRTbGlkZSAvIF8ub3B0aW9ucy5zbGlkZXNUb1Njcm9sbCkpXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKCdzbGljay1hY3RpdmUnKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgU2xpY2sucHJvdG90eXBlLnZpc2liaWxpdHkgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgXyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCBfLm9wdGlvbnMuYXV0b3BsYXkgKSB7XG5cbiAgICAgICAgICAgIGlmICggZG9jdW1lbnRbXy5oaWRkZW5dICkge1xuXG4gICAgICAgICAgICAgICAgXy5pbnRlcnJ1cHRlZCA9IHRydWU7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBfLmludGVycnVwdGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgJC5mbi5zbGljayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgXyA9IHRoaXMsXG4gICAgICAgICAgICBvcHQgPSBhcmd1bWVudHNbMF0sXG4gICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcbiAgICAgICAgICAgIGwgPSBfLmxlbmd0aCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICByZXQ7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0ID09ICdvYmplY3QnIHx8IHR5cGVvZiBvcHQgPT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICAgICAgX1tpXS5zbGljayA9IG5ldyBTbGljayhfW2ldLCBvcHQpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldCA9IF9baV0uc2xpY2tbb3B0XS5hcHBseShfW2ldLnNsaWNrLCBhcmdzKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmV0ICE9ICd1bmRlZmluZWQnKSByZXR1cm4gcmV0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfO1xuICAgIH07XG5cbn0pKTtcbiIsIi8qIVxuICogalF1ZXJ5IFZhbGlkYXRpb24gUGx1Z2luIHYxLjE5LjFcbiAqXG4gKiBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL1xuICpcbiAqIENvcHlyaWdodCAoYykgMjAxOSBKw7ZybiBaYWVmZmVyZXJcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICovXG4oZnVuY3Rpb24oIGZhY3RvcnkgKSB7XG5cdGlmICggdHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQgKSB7XG5cdFx0ZGVmaW5lKCBbXCJqcXVlcnlcIl0sIGZhY3RvcnkgKTtcblx0fSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCByZXF1aXJlKCBcImpxdWVyeVwiICkgKTtcblx0fSBlbHNlIHtcblx0XHRmYWN0b3J5KCBqUXVlcnkgKTtcblx0fVxufShmdW5jdGlvbiggJCApIHtcblxuJC5leHRlbmQoICQuZm4sIHtcblxuXHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3ZhbGlkYXRlL1xuXHR2YWxpZGF0ZTogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cblx0XHQvLyBJZiBub3RoaW5nIGlzIHNlbGVjdGVkLCByZXR1cm4gbm90aGluZzsgY2FuJ3QgY2hhaW4gYW55d2F5XG5cdFx0aWYgKCAhdGhpcy5sZW5ndGggKSB7XG5cdFx0XHRpZiAoIG9wdGlvbnMgJiYgb3B0aW9ucy5kZWJ1ZyAmJiB3aW5kb3cuY29uc29sZSApIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCBcIk5vdGhpbmcgc2VsZWN0ZWQsIGNhbid0IHZhbGlkYXRlLCByZXR1cm5pbmcgbm90aGluZy5cIiApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIENoZWNrIGlmIGEgdmFsaWRhdG9yIGZvciB0aGlzIGZvcm0gd2FzIGFscmVhZHkgY3JlYXRlZFxuXHRcdHZhciB2YWxpZGF0b3IgPSAkLmRhdGEoIHRoaXNbIDAgXSwgXCJ2YWxpZGF0b3JcIiApO1xuXHRcdGlmICggdmFsaWRhdG9yICkge1xuXHRcdFx0cmV0dXJuIHZhbGlkYXRvcjtcblx0XHR9XG5cblx0XHQvLyBBZGQgbm92YWxpZGF0ZSB0YWcgaWYgSFRNTDUuXG5cdFx0dGhpcy5hdHRyKCBcIm5vdmFsaWRhdGVcIiwgXCJub3ZhbGlkYXRlXCIgKTtcblxuXHRcdHZhbGlkYXRvciA9IG5ldyAkLnZhbGlkYXRvciggb3B0aW9ucywgdGhpc1sgMCBdICk7XG5cdFx0JC5kYXRhKCB0aGlzWyAwIF0sIFwidmFsaWRhdG9yXCIsIHZhbGlkYXRvciApO1xuXG5cdFx0aWYgKCB2YWxpZGF0b3Iuc2V0dGluZ3Mub25zdWJtaXQgKSB7XG5cblx0XHRcdHRoaXMub24oIFwiY2xpY2sudmFsaWRhdGVcIiwgXCI6c3VibWl0XCIsIGZ1bmN0aW9uKCBldmVudCApIHtcblxuXHRcdFx0XHQvLyBUcmFjayB0aGUgdXNlZCBzdWJtaXQgYnV0dG9uIHRvIHByb3Blcmx5IGhhbmRsZSBzY3JpcHRlZFxuXHRcdFx0XHQvLyBzdWJtaXRzIGxhdGVyLlxuXHRcdFx0XHR2YWxpZGF0b3Iuc3VibWl0QnV0dG9uID0gZXZlbnQuY3VycmVudFRhcmdldDtcblxuXHRcdFx0XHQvLyBBbGxvdyBzdXBwcmVzc2luZyB2YWxpZGF0aW9uIGJ5IGFkZGluZyBhIGNhbmNlbCBjbGFzcyB0byB0aGUgc3VibWl0IGJ1dHRvblxuXHRcdFx0XHRpZiAoICQoIHRoaXMgKS5oYXNDbGFzcyggXCJjYW5jZWxcIiApICkge1xuXHRcdFx0XHRcdHZhbGlkYXRvci5jYW5jZWxTdWJtaXQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQWxsb3cgc3VwcHJlc3NpbmcgdmFsaWRhdGlvbiBieSBhZGRpbmcgdGhlIGh0bWw1IGZvcm1ub3ZhbGlkYXRlIGF0dHJpYnV0ZSB0byB0aGUgc3VibWl0IGJ1dHRvblxuXHRcdFx0XHRpZiAoICQoIHRoaXMgKS5hdHRyKCBcImZvcm1ub3ZhbGlkYXRlXCIgKSAhPT0gdW5kZWZpbmVkICkge1xuXHRcdFx0XHRcdHZhbGlkYXRvci5jYW5jZWxTdWJtaXQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cblx0XHRcdC8vIFZhbGlkYXRlIHRoZSBmb3JtIG9uIHN1Ym1pdFxuXHRcdFx0dGhpcy5vbiggXCJzdWJtaXQudmFsaWRhdGVcIiwgZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0XHRpZiAoIHZhbGlkYXRvci5zZXR0aW5ncy5kZWJ1ZyApIHtcblxuXHRcdFx0XHRcdC8vIFByZXZlbnQgZm9ybSBzdWJtaXQgdG8gYmUgYWJsZSB0byBzZWUgY29uc29sZSBvdXRwdXRcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZnVuY3Rpb24gaGFuZGxlKCkge1xuXHRcdFx0XHRcdHZhciBoaWRkZW4sIHJlc3VsdDtcblxuXHRcdFx0XHRcdC8vIEluc2VydCBhIGhpZGRlbiBpbnB1dCBhcyBhIHJlcGxhY2VtZW50IGZvciB0aGUgbWlzc2luZyBzdWJtaXQgYnV0dG9uXG5cdFx0XHRcdFx0Ly8gVGhlIGhpZGRlbiBpbnB1dCBpcyBpbnNlcnRlZCBpbiB0d28gY2FzZXM6XG5cdFx0XHRcdFx0Ly8gICAtIEEgdXNlciBkZWZpbmVkIGEgYHN1Ym1pdEhhbmRsZXJgXG5cdFx0XHRcdFx0Ly8gICAtIFRoZXJlIHdhcyBhIHBlbmRpbmcgcmVxdWVzdCBkdWUgdG8gYHJlbW90ZWAgbWV0aG9kIGFuZCBgc3RvcFJlcXVlc3QoKWBcblx0XHRcdFx0XHQvLyAgICAgd2FzIGNhbGxlZCB0byBzdWJtaXQgdGhlIGZvcm0gaW4gY2FzZSBpdCdzIHZhbGlkXG5cdFx0XHRcdFx0aWYgKCB2YWxpZGF0b3Iuc3VibWl0QnV0dG9uICYmICggdmFsaWRhdG9yLnNldHRpbmdzLnN1Ym1pdEhhbmRsZXIgfHwgdmFsaWRhdG9yLmZvcm1TdWJtaXR0ZWQgKSApIHtcblx0XHRcdFx0XHRcdGhpZGRlbiA9ICQoIFwiPGlucHV0IHR5cGU9J2hpZGRlbicvPlwiIClcblx0XHRcdFx0XHRcdFx0LmF0dHIoIFwibmFtZVwiLCB2YWxpZGF0b3Iuc3VibWl0QnV0dG9uLm5hbWUgKVxuXHRcdFx0XHRcdFx0XHQudmFsKCAkKCB2YWxpZGF0b3Iuc3VibWl0QnV0dG9uICkudmFsKCkgKVxuXHRcdFx0XHRcdFx0XHQuYXBwZW5kVG8oIHZhbGlkYXRvci5jdXJyZW50Rm9ybSApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmICggdmFsaWRhdG9yLnNldHRpbmdzLnN1Ym1pdEhhbmRsZXIgJiYgIXZhbGlkYXRvci5zZXR0aW5ncy5kZWJ1ZyApIHtcblx0XHRcdFx0XHRcdHJlc3VsdCA9IHZhbGlkYXRvci5zZXR0aW5ncy5zdWJtaXRIYW5kbGVyLmNhbGwoIHZhbGlkYXRvciwgdmFsaWRhdG9yLmN1cnJlbnRGb3JtLCBldmVudCApO1xuXHRcdFx0XHRcdFx0aWYgKCBoaWRkZW4gKSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gQW5kIGNsZWFuIHVwIGFmdGVyd2FyZHM7IHRoYW5rcyB0byBuby1ibG9jay1zY29wZSwgaGlkZGVuIGNhbiBiZSByZWZlcmVuY2VkXG5cdFx0XHRcdFx0XHRcdGhpZGRlbi5yZW1vdmUoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGlmICggcmVzdWx0ICE9PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gUHJldmVudCBzdWJtaXQgZm9yIGludmFsaWQgZm9ybXMgb3IgY3VzdG9tIHN1Ym1pdCBoYW5kbGVyc1xuXHRcdFx0XHRpZiAoIHZhbGlkYXRvci5jYW5jZWxTdWJtaXQgKSB7XG5cdFx0XHRcdFx0dmFsaWRhdG9yLmNhbmNlbFN1Ym1pdCA9IGZhbHNlO1xuXHRcdFx0XHRcdHJldHVybiBoYW5kbGUoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIHZhbGlkYXRvci5mb3JtKCkgKSB7XG5cdFx0XHRcdFx0aWYgKCB2YWxpZGF0b3IucGVuZGluZ1JlcXVlc3QgKSB7XG5cdFx0XHRcdFx0XHR2YWxpZGF0b3IuZm9ybVN1Ym1pdHRlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBoYW5kbGUoKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2YWxpZGF0b3IuZm9jdXNJbnZhbGlkKCk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHZhbGlkYXRvcjtcblx0fSxcblxuXHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3ZhbGlkL1xuXHR2YWxpZDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHZhbGlkLCB2YWxpZGF0b3IsIGVycm9yTGlzdDtcblxuXHRcdGlmICggJCggdGhpc1sgMCBdICkuaXMoIFwiZm9ybVwiICkgKSB7XG5cdFx0XHR2YWxpZCA9IHRoaXMudmFsaWRhdGUoKS5mb3JtKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGVycm9yTGlzdCA9IFtdO1xuXHRcdFx0dmFsaWQgPSB0cnVlO1xuXHRcdFx0dmFsaWRhdG9yID0gJCggdGhpc1sgMCBdLmZvcm0gKS52YWxpZGF0ZSgpO1xuXHRcdFx0dGhpcy5lYWNoKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFsaWQgPSB2YWxpZGF0b3IuZWxlbWVudCggdGhpcyApICYmIHZhbGlkO1xuXHRcdFx0XHRpZiAoICF2YWxpZCApIHtcblx0XHRcdFx0XHRlcnJvckxpc3QgPSBlcnJvckxpc3QuY29uY2F0KCB2YWxpZGF0b3IuZXJyb3JMaXN0ICk7XG5cdFx0XHRcdH1cblx0XHRcdH0gKTtcblx0XHRcdHZhbGlkYXRvci5lcnJvckxpc3QgPSBlcnJvckxpc3Q7XG5cdFx0fVxuXHRcdHJldHVybiB2YWxpZDtcblx0fSxcblxuXHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3J1bGVzL1xuXHRydWxlczogZnVuY3Rpb24oIGNvbW1hbmQsIGFyZ3VtZW50ICkge1xuXHRcdHZhciBlbGVtZW50ID0gdGhpc1sgMCBdLFxuXHRcdFx0aXNDb250ZW50RWRpdGFibGUgPSB0eXBlb2YgdGhpcy5hdHRyKCBcImNvbnRlbnRlZGl0YWJsZVwiICkgIT09IFwidW5kZWZpbmVkXCIgJiYgdGhpcy5hdHRyKCBcImNvbnRlbnRlZGl0YWJsZVwiICkgIT09IFwiZmFsc2VcIixcblx0XHRcdHNldHRpbmdzLCBzdGF0aWNSdWxlcywgZXhpc3RpbmdSdWxlcywgZGF0YSwgcGFyYW0sIGZpbHRlcmVkO1xuXG5cdFx0Ly8gSWYgbm90aGluZyBpcyBzZWxlY3RlZCwgcmV0dXJuIGVtcHR5IG9iamVjdDsgY2FuJ3QgY2hhaW4gYW55d2F5XG5cdFx0aWYgKCBlbGVtZW50ID09IG51bGwgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCAhZWxlbWVudC5mb3JtICYmIGlzQ29udGVudEVkaXRhYmxlICkge1xuXHRcdFx0ZWxlbWVudC5mb3JtID0gdGhpcy5jbG9zZXN0KCBcImZvcm1cIiApWyAwIF07XG5cdFx0XHRlbGVtZW50Lm5hbWUgPSB0aGlzLmF0dHIoIFwibmFtZVwiICk7XG5cdFx0fVxuXG5cdFx0aWYgKCBlbGVtZW50LmZvcm0gPT0gbnVsbCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoIGNvbW1hbmQgKSB7XG5cdFx0XHRzZXR0aW5ncyA9ICQuZGF0YSggZWxlbWVudC5mb3JtLCBcInZhbGlkYXRvclwiICkuc2V0dGluZ3M7XG5cdFx0XHRzdGF0aWNSdWxlcyA9IHNldHRpbmdzLnJ1bGVzO1xuXHRcdFx0ZXhpc3RpbmdSdWxlcyA9ICQudmFsaWRhdG9yLnN0YXRpY1J1bGVzKCBlbGVtZW50ICk7XG5cdFx0XHRzd2l0Y2ggKCBjb21tYW5kICkge1xuXHRcdFx0Y2FzZSBcImFkZFwiOlxuXHRcdFx0XHQkLmV4dGVuZCggZXhpc3RpbmdSdWxlcywgJC52YWxpZGF0b3Iubm9ybWFsaXplUnVsZSggYXJndW1lbnQgKSApO1xuXG5cdFx0XHRcdC8vIFJlbW92ZSBtZXNzYWdlcyBmcm9tIHJ1bGVzLCBidXQgYWxsb3cgdGhlbSB0byBiZSBzZXQgc2VwYXJhdGVseVxuXHRcdFx0XHRkZWxldGUgZXhpc3RpbmdSdWxlcy5tZXNzYWdlcztcblx0XHRcdFx0c3RhdGljUnVsZXNbIGVsZW1lbnQubmFtZSBdID0gZXhpc3RpbmdSdWxlcztcblx0XHRcdFx0aWYgKCBhcmd1bWVudC5tZXNzYWdlcyApIHtcblx0XHRcdFx0XHRzZXR0aW5ncy5tZXNzYWdlc1sgZWxlbWVudC5uYW1lIF0gPSAkLmV4dGVuZCggc2V0dGluZ3MubWVzc2FnZXNbIGVsZW1lbnQubmFtZSBdLCBhcmd1bWVudC5tZXNzYWdlcyApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcInJlbW92ZVwiOlxuXHRcdFx0XHRpZiAoICFhcmd1bWVudCApIHtcblx0XHRcdFx0XHRkZWxldGUgc3RhdGljUnVsZXNbIGVsZW1lbnQubmFtZSBdO1xuXHRcdFx0XHRcdHJldHVybiBleGlzdGluZ1J1bGVzO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGZpbHRlcmVkID0ge307XG5cdFx0XHRcdCQuZWFjaCggYXJndW1lbnQuc3BsaXQoIC9cXHMvICksIGZ1bmN0aW9uKCBpbmRleCwgbWV0aG9kICkge1xuXHRcdFx0XHRcdGZpbHRlcmVkWyBtZXRob2QgXSA9IGV4aXN0aW5nUnVsZXNbIG1ldGhvZCBdO1xuXHRcdFx0XHRcdGRlbGV0ZSBleGlzdGluZ1J1bGVzWyBtZXRob2QgXTtcblx0XHRcdFx0fSApO1xuXHRcdFx0XHRyZXR1cm4gZmlsdGVyZWQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZGF0YSA9ICQudmFsaWRhdG9yLm5vcm1hbGl6ZVJ1bGVzKFxuXHRcdCQuZXh0ZW5kKFxuXHRcdFx0e30sXG5cdFx0XHQkLnZhbGlkYXRvci5jbGFzc1J1bGVzKCBlbGVtZW50ICksXG5cdFx0XHQkLnZhbGlkYXRvci5hdHRyaWJ1dGVSdWxlcyggZWxlbWVudCApLFxuXHRcdFx0JC52YWxpZGF0b3IuZGF0YVJ1bGVzKCBlbGVtZW50ICksXG5cdFx0XHQkLnZhbGlkYXRvci5zdGF0aWNSdWxlcyggZWxlbWVudCApXG5cdFx0KSwgZWxlbWVudCApO1xuXG5cdFx0Ly8gTWFrZSBzdXJlIHJlcXVpcmVkIGlzIGF0IGZyb250XG5cdFx0aWYgKCBkYXRhLnJlcXVpcmVkICkge1xuXHRcdFx0cGFyYW0gPSBkYXRhLnJlcXVpcmVkO1xuXHRcdFx0ZGVsZXRlIGRhdGEucmVxdWlyZWQ7XG5cdFx0XHRkYXRhID0gJC5leHRlbmQoIHsgcmVxdWlyZWQ6IHBhcmFtIH0sIGRhdGEgKTtcblx0XHR9XG5cblx0XHQvLyBNYWtlIHN1cmUgcmVtb3RlIGlzIGF0IGJhY2tcblx0XHRpZiAoIGRhdGEucmVtb3RlICkge1xuXHRcdFx0cGFyYW0gPSBkYXRhLnJlbW90ZTtcblx0XHRcdGRlbGV0ZSBkYXRhLnJlbW90ZTtcblx0XHRcdGRhdGEgPSAkLmV4dGVuZCggZGF0YSwgeyByZW1vdGU6IHBhcmFtIH0gKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZGF0YTtcblx0fVxufSApO1xuXG4vLyBDdXN0b20gc2VsZWN0b3JzXG4kLmV4dGVuZCggJC5leHByLnBzZXVkb3MgfHwgJC5leHByWyBcIjpcIiBdLCB7XHRcdC8vICd8fCAkLmV4cHJbIFwiOlwiIF0nIGhlcmUgZW5hYmxlcyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB0byBqUXVlcnkgMS43LiBDYW4gYmUgcmVtb3ZlZCB3aGVuIGRyb3BwaW5nIGpRIDEuNy54IHN1cHBvcnRcblxuXHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2JsYW5rLXNlbGVjdG9yL1xuXHRibGFuazogZnVuY3Rpb24oIGEgKSB7XG5cdFx0cmV0dXJuICEkLnRyaW0oIFwiXCIgKyAkKCBhICkudmFsKCkgKTtcblx0fSxcblxuXHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2ZpbGxlZC1zZWxlY3Rvci9cblx0ZmlsbGVkOiBmdW5jdGlvbiggYSApIHtcblx0XHR2YXIgdmFsID0gJCggYSApLnZhbCgpO1xuXHRcdHJldHVybiB2YWwgIT09IG51bGwgJiYgISEkLnRyaW0oIFwiXCIgKyB2YWwgKTtcblx0fSxcblxuXHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL3VuY2hlY2tlZC1zZWxlY3Rvci9cblx0dW5jaGVja2VkOiBmdW5jdGlvbiggYSApIHtcblx0XHRyZXR1cm4gISQoIGEgKS5wcm9wKCBcImNoZWNrZWRcIiApO1xuXHR9XG59ICk7XG5cbi8vIENvbnN0cnVjdG9yIGZvciB2YWxpZGF0b3JcbiQudmFsaWRhdG9yID0gZnVuY3Rpb24oIG9wdGlvbnMsIGZvcm0gKSB7XG5cdHRoaXMuc2V0dGluZ3MgPSAkLmV4dGVuZCggdHJ1ZSwge30sICQudmFsaWRhdG9yLmRlZmF1bHRzLCBvcHRpb25zICk7XG5cdHRoaXMuY3VycmVudEZvcm0gPSBmb3JtO1xuXHR0aGlzLmluaXQoKTtcbn07XG5cbi8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvalF1ZXJ5LnZhbGlkYXRvci5mb3JtYXQvXG4kLnZhbGlkYXRvci5mb3JtYXQgPSBmdW5jdGlvbiggc291cmNlLCBwYXJhbXMgKSB7XG5cdGlmICggYXJndW1lbnRzLmxlbmd0aCA9PT0gMSApIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgYXJncyA9ICQubWFrZUFycmF5KCBhcmd1bWVudHMgKTtcblx0XHRcdGFyZ3MudW5zaGlmdCggc291cmNlICk7XG5cdFx0XHRyZXR1cm4gJC52YWxpZGF0b3IuZm9ybWF0LmFwcGx5KCB0aGlzLCBhcmdzICk7XG5cdFx0fTtcblx0fVxuXHRpZiAoIHBhcmFtcyA9PT0gdW5kZWZpbmVkICkge1xuXHRcdHJldHVybiBzb3VyY2U7XG5cdH1cblx0aWYgKCBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBwYXJhbXMuY29uc3RydWN0b3IgIT09IEFycmF5ICApIHtcblx0XHRwYXJhbXMgPSAkLm1ha2VBcnJheSggYXJndW1lbnRzICkuc2xpY2UoIDEgKTtcblx0fVxuXHRpZiAoIHBhcmFtcy5jb25zdHJ1Y3RvciAhPT0gQXJyYXkgKSB7XG5cdFx0cGFyYW1zID0gWyBwYXJhbXMgXTtcblx0fVxuXHQkLmVhY2goIHBhcmFtcywgZnVuY3Rpb24oIGksIG4gKSB7XG5cdFx0c291cmNlID0gc291cmNlLnJlcGxhY2UoIG5ldyBSZWdFeHAoIFwiXFxcXHtcIiArIGkgKyBcIlxcXFx9XCIsIFwiZ1wiICksIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIG47XG5cdFx0fSApO1xuXHR9ICk7XG5cdHJldHVybiBzb3VyY2U7XG59O1xuXG4kLmV4dGVuZCggJC52YWxpZGF0b3IsIHtcblxuXHRkZWZhdWx0czoge1xuXHRcdG1lc3NhZ2VzOiB7fSxcblx0XHRncm91cHM6IHt9LFxuXHRcdHJ1bGVzOiB7fSxcblx0XHRlcnJvckNsYXNzOiBcImVycm9yXCIsXG5cdFx0cGVuZGluZ0NsYXNzOiBcInBlbmRpbmdcIixcblx0XHR2YWxpZENsYXNzOiBcInZhbGlkXCIsXG5cdFx0ZXJyb3JFbGVtZW50OiBcImxhYmVsXCIsXG5cdFx0Zm9jdXNDbGVhbnVwOiBmYWxzZSxcblx0XHRmb2N1c0ludmFsaWQ6IHRydWUsXG5cdFx0ZXJyb3JDb250YWluZXI6ICQoIFtdICksXG5cdFx0ZXJyb3JMYWJlbENvbnRhaW5lcjogJCggW10gKSxcblx0XHRvbnN1Ym1pdDogdHJ1ZSxcblx0XHRpZ25vcmU6IFwiOmhpZGRlblwiLFxuXHRcdGlnbm9yZVRpdGxlOiBmYWxzZSxcblx0XHRvbmZvY3VzaW46IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0dGhpcy5sYXN0QWN0aXZlID0gZWxlbWVudDtcblxuXHRcdFx0Ly8gSGlkZSBlcnJvciBsYWJlbCBhbmQgcmVtb3ZlIGVycm9yIGNsYXNzIG9uIGZvY3VzIGlmIGVuYWJsZWRcblx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy5mb2N1c0NsZWFudXAgKSB7XG5cdFx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy51bmhpZ2hsaWdodCApIHtcblx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLnVuaGlnaGxpZ2h0LmNhbGwoIHRoaXMsIGVsZW1lbnQsIHRoaXMuc2V0dGluZ3MuZXJyb3JDbGFzcywgdGhpcy5zZXR0aW5ncy52YWxpZENsYXNzICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy5oaWRlVGhlc2UoIHRoaXMuZXJyb3JzRm9yKCBlbGVtZW50ICkgKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdG9uZm9jdXNvdXQ6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0aWYgKCAhdGhpcy5jaGVja2FibGUoIGVsZW1lbnQgKSAmJiAoIGVsZW1lbnQubmFtZSBpbiB0aGlzLnN1Ym1pdHRlZCB8fCAhdGhpcy5vcHRpb25hbCggZWxlbWVudCApICkgKSB7XG5cdFx0XHRcdHRoaXMuZWxlbWVudCggZWxlbWVudCApO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0b25rZXl1cDogZnVuY3Rpb24oIGVsZW1lbnQsIGV2ZW50ICkge1xuXG5cdFx0XHQvLyBBdm9pZCByZXZhbGlkYXRlIHRoZSBmaWVsZCB3aGVuIHByZXNzaW5nIG9uZSBvZiB0aGUgZm9sbG93aW5nIGtleXNcblx0XHRcdC8vIFNoaWZ0ICAgICAgID0+IDE2XG5cdFx0XHQvLyBDdHJsICAgICAgICA9PiAxN1xuXHRcdFx0Ly8gQWx0ICAgICAgICAgPT4gMThcblx0XHRcdC8vIENhcHMgbG9jayAgID0+IDIwXG5cdFx0XHQvLyBFbmQgICAgICAgICA9PiAzNVxuXHRcdFx0Ly8gSG9tZSAgICAgICAgPT4gMzZcblx0XHRcdC8vIExlZnQgYXJyb3cgID0+IDM3XG5cdFx0XHQvLyBVcCBhcnJvdyAgICA9PiAzOFxuXHRcdFx0Ly8gUmlnaHQgYXJyb3cgPT4gMzlcblx0XHRcdC8vIERvd24gYXJyb3cgID0+IDQwXG5cdFx0XHQvLyBJbnNlcnQgICAgICA9PiA0NVxuXHRcdFx0Ly8gTnVtIGxvY2sgICAgPT4gMTQ0XG5cdFx0XHQvLyBBbHRHciBrZXkgICA9PiAyMjVcblx0XHRcdHZhciBleGNsdWRlZEtleXMgPSBbXG5cdFx0XHRcdDE2LCAxNywgMTgsIDIwLCAzNSwgMzYsIDM3LFxuXHRcdFx0XHQzOCwgMzksIDQwLCA0NSwgMTQ0LCAyMjVcblx0XHRcdF07XG5cblx0XHRcdGlmICggZXZlbnQud2hpY2ggPT09IDkgJiYgdGhpcy5lbGVtZW50VmFsdWUoIGVsZW1lbnQgKSA9PT0gXCJcIiB8fCAkLmluQXJyYXkoIGV2ZW50LmtleUNvZGUsIGV4Y2x1ZGVkS2V5cyApICE9PSAtMSApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fSBlbHNlIGlmICggZWxlbWVudC5uYW1lIGluIHRoaXMuc3VibWl0dGVkIHx8IGVsZW1lbnQubmFtZSBpbiB0aGlzLmludmFsaWQgKSB7XG5cdFx0XHRcdHRoaXMuZWxlbWVudCggZWxlbWVudCApO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0b25jbGljazogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cblx0XHRcdC8vIENsaWNrIG9uIHNlbGVjdHMsIHJhZGlvYnV0dG9ucyBhbmQgY2hlY2tib3hlc1xuXHRcdFx0aWYgKCBlbGVtZW50Lm5hbWUgaW4gdGhpcy5zdWJtaXR0ZWQgKSB7XG5cdFx0XHRcdHRoaXMuZWxlbWVudCggZWxlbWVudCApO1xuXG5cdFx0XHQvLyBPciBvcHRpb24gZWxlbWVudHMsIGNoZWNrIHBhcmVudCBzZWxlY3QgaW4gdGhhdCBjYXNlXG5cdFx0XHR9IGVsc2UgaWYgKCBlbGVtZW50LnBhcmVudE5vZGUubmFtZSBpbiB0aGlzLnN1Ym1pdHRlZCApIHtcblx0XHRcdFx0dGhpcy5lbGVtZW50KCBlbGVtZW50LnBhcmVudE5vZGUgKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGhpZ2hsaWdodDogZnVuY3Rpb24oIGVsZW1lbnQsIGVycm9yQ2xhc3MsIHZhbGlkQ2xhc3MgKSB7XG5cdFx0XHRpZiAoIGVsZW1lbnQudHlwZSA9PT0gXCJyYWRpb1wiICkge1xuXHRcdFx0XHR0aGlzLmZpbmRCeU5hbWUoIGVsZW1lbnQubmFtZSApLmFkZENsYXNzKCBlcnJvckNsYXNzICkucmVtb3ZlQ2xhc3MoIHZhbGlkQ2xhc3MgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCQoIGVsZW1lbnQgKS5hZGRDbGFzcyggZXJyb3JDbGFzcyApLnJlbW92ZUNsYXNzKCB2YWxpZENsYXNzICk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHR1bmhpZ2hsaWdodDogZnVuY3Rpb24oIGVsZW1lbnQsIGVycm9yQ2xhc3MsIHZhbGlkQ2xhc3MgKSB7XG5cdFx0XHRpZiAoIGVsZW1lbnQudHlwZSA9PT0gXCJyYWRpb1wiICkge1xuXHRcdFx0XHR0aGlzLmZpbmRCeU5hbWUoIGVsZW1lbnQubmFtZSApLnJlbW92ZUNsYXNzKCBlcnJvckNsYXNzICkuYWRkQ2xhc3MoIHZhbGlkQ2xhc3MgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCQoIGVsZW1lbnQgKS5yZW1vdmVDbGFzcyggZXJyb3JDbGFzcyApLmFkZENsYXNzKCB2YWxpZENsYXNzICk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdC8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvalF1ZXJ5LnZhbGlkYXRvci5zZXREZWZhdWx0cy9cblx0c2V0RGVmYXVsdHM6IGZ1bmN0aW9uKCBzZXR0aW5ncyApIHtcblx0XHQkLmV4dGVuZCggJC52YWxpZGF0b3IuZGVmYXVsdHMsIHNldHRpbmdzICk7XG5cdH0sXG5cblx0bWVzc2FnZXM6IHtcblx0XHRyZXF1aXJlZDogXCJUaGlzIGZpZWxkIGlzIHJlcXVpcmVkLlwiLFxuXHRcdHJlbW90ZTogXCJQbGVhc2UgZml4IHRoaXMgZmllbGQuXCIsXG5cdFx0ZW1haWw6IFwiUGxlYXNlIGVudGVyIGEgdmFsaWQgZW1haWwgYWRkcmVzcy5cIixcblx0XHR1cmw6IFwiUGxlYXNlIGVudGVyIGEgdmFsaWQgVVJMLlwiLFxuXHRcdGRhdGU6IFwiUGxlYXNlIGVudGVyIGEgdmFsaWQgZGF0ZS5cIixcblx0XHRkYXRlSVNPOiBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIGRhdGUgKElTTykuXCIsXG5cdFx0bnVtYmVyOiBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIG51bWJlci5cIixcblx0XHRkaWdpdHM6IFwiUGxlYXNlIGVudGVyIG9ubHkgZGlnaXRzLlwiLFxuXHRcdGVxdWFsVG86IFwiUGxlYXNlIGVudGVyIHRoZSBzYW1lIHZhbHVlIGFnYWluLlwiLFxuXHRcdG1heGxlbmd0aDogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBsZWFzZSBlbnRlciBubyBtb3JlIHRoYW4gezB9IGNoYXJhY3RlcnMuXCIgKSxcblx0XHRtaW5sZW5ndGg6ICQudmFsaWRhdG9yLmZvcm1hdCggXCJQbGVhc2UgZW50ZXIgYXQgbGVhc3QgezB9IGNoYXJhY3RlcnMuXCIgKSxcblx0XHRyYW5nZWxlbmd0aDogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBsZWFzZSBlbnRlciBhIHZhbHVlIGJldHdlZW4gezB9IGFuZCB7MX0gY2hhcmFjdGVycyBsb25nLlwiICksXG5cdFx0cmFuZ2U6ICQudmFsaWRhdG9yLmZvcm1hdCggXCJQbGVhc2UgZW50ZXIgYSB2YWx1ZSBiZXR3ZWVuIHswfSBhbmQgezF9LlwiICksXG5cdFx0bWF4OiAkLnZhbGlkYXRvci5mb3JtYXQoIFwiUGxlYXNlIGVudGVyIGEgdmFsdWUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHswfS5cIiApLFxuXHRcdG1pbjogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBsZWFzZSBlbnRlciBhIHZhbHVlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB7MH0uXCIgKSxcblx0XHRzdGVwOiAkLnZhbGlkYXRvci5mb3JtYXQoIFwiUGxlYXNlIGVudGVyIGEgbXVsdGlwbGUgb2YgezB9LlwiIClcblx0fSxcblxuXHRhdXRvQ3JlYXRlUmFuZ2VzOiBmYWxzZSxcblxuXHRwcm90b3R5cGU6IHtcblxuXHRcdGluaXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5sYWJlbENvbnRhaW5lciA9ICQoIHRoaXMuc2V0dGluZ3MuZXJyb3JMYWJlbENvbnRhaW5lciApO1xuXHRcdFx0dGhpcy5lcnJvckNvbnRleHQgPSB0aGlzLmxhYmVsQ29udGFpbmVyLmxlbmd0aCAmJiB0aGlzLmxhYmVsQ29udGFpbmVyIHx8ICQoIHRoaXMuY3VycmVudEZvcm0gKTtcblx0XHRcdHRoaXMuY29udGFpbmVycyA9ICQoIHRoaXMuc2V0dGluZ3MuZXJyb3JDb250YWluZXIgKS5hZGQoIHRoaXMuc2V0dGluZ3MuZXJyb3JMYWJlbENvbnRhaW5lciApO1xuXHRcdFx0dGhpcy5zdWJtaXR0ZWQgPSB7fTtcblx0XHRcdHRoaXMudmFsdWVDYWNoZSA9IHt9O1xuXHRcdFx0dGhpcy5wZW5kaW5nUmVxdWVzdCA9IDA7XG5cdFx0XHR0aGlzLnBlbmRpbmcgPSB7fTtcblx0XHRcdHRoaXMuaW52YWxpZCA9IHt9O1xuXHRcdFx0dGhpcy5yZXNldCgpO1xuXG5cdFx0XHR2YXIgY3VycmVudEZvcm0gPSB0aGlzLmN1cnJlbnRGb3JtLFxuXHRcdFx0XHRncm91cHMgPSAoIHRoaXMuZ3JvdXBzID0ge30gKSxcblx0XHRcdFx0cnVsZXM7XG5cdFx0XHQkLmVhY2goIHRoaXMuc2V0dGluZ3MuZ3JvdXBzLCBmdW5jdGlvbigga2V5LCB2YWx1ZSApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRcdFx0dmFsdWUgPSB2YWx1ZS5zcGxpdCggL1xccy8gKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQkLmVhY2goIHZhbHVlLCBmdW5jdGlvbiggaW5kZXgsIG5hbWUgKSB7XG5cdFx0XHRcdFx0Z3JvdXBzWyBuYW1lIF0gPSBrZXk7XG5cdFx0XHRcdH0gKTtcblx0XHRcdH0gKTtcblx0XHRcdHJ1bGVzID0gdGhpcy5zZXR0aW5ncy5ydWxlcztcblx0XHRcdCQuZWFjaCggcnVsZXMsIGZ1bmN0aW9uKCBrZXksIHZhbHVlICkge1xuXHRcdFx0XHRydWxlc1sga2V5IF0gPSAkLnZhbGlkYXRvci5ub3JtYWxpemVSdWxlKCB2YWx1ZSApO1xuXHRcdFx0fSApO1xuXG5cdFx0XHRmdW5jdGlvbiBkZWxlZ2F0ZSggZXZlbnQgKSB7XG5cdFx0XHRcdHZhciBpc0NvbnRlbnRFZGl0YWJsZSA9IHR5cGVvZiAkKCB0aGlzICkuYXR0ciggXCJjb250ZW50ZWRpdGFibGVcIiApICE9PSBcInVuZGVmaW5lZFwiICYmICQoIHRoaXMgKS5hdHRyKCBcImNvbnRlbnRlZGl0YWJsZVwiICkgIT09IFwiZmFsc2VcIjtcblxuXHRcdFx0XHQvLyBTZXQgZm9ybSBleHBhbmRvIG9uIGNvbnRlbnRlZGl0YWJsZVxuXHRcdFx0XHRpZiAoICF0aGlzLmZvcm0gJiYgaXNDb250ZW50RWRpdGFibGUgKSB7XG5cdFx0XHRcdFx0dGhpcy5mb3JtID0gJCggdGhpcyApLmNsb3Nlc3QoIFwiZm9ybVwiIClbIDAgXTtcblx0XHRcdFx0XHR0aGlzLm5hbWUgPSAkKCB0aGlzICkuYXR0ciggXCJuYW1lXCIgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIElnbm9yZSB0aGUgZWxlbWVudCBpZiBpdCBiZWxvbmdzIHRvIGFub3RoZXIgZm9ybS4gVGhpcyB3aWxsIGhhcHBlbiBtYWlubHlcblx0XHRcdFx0Ly8gd2hlbiBzZXR0aW5nIHRoZSBgZm9ybWAgYXR0cmlidXRlIG9mIGFuIGlucHV0IHRvIHRoZSBpZCBvZiBhbm90aGVyIGZvcm0uXG5cdFx0XHRcdGlmICggY3VycmVudEZvcm0gIT09IHRoaXMuZm9ybSApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgdmFsaWRhdG9yID0gJC5kYXRhKCB0aGlzLmZvcm0sIFwidmFsaWRhdG9yXCIgKSxcblx0XHRcdFx0XHRldmVudFR5cGUgPSBcIm9uXCIgKyBldmVudC50eXBlLnJlcGxhY2UoIC9edmFsaWRhdGUvLCBcIlwiICksXG5cdFx0XHRcdFx0c2V0dGluZ3MgPSB2YWxpZGF0b3Iuc2V0dGluZ3M7XG5cdFx0XHRcdGlmICggc2V0dGluZ3NbIGV2ZW50VHlwZSBdICYmICEkKCB0aGlzICkuaXMoIHNldHRpbmdzLmlnbm9yZSApICkge1xuXHRcdFx0XHRcdHNldHRpbmdzWyBldmVudFR5cGUgXS5jYWxsKCB2YWxpZGF0b3IsIHRoaXMsIGV2ZW50ICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0JCggdGhpcy5jdXJyZW50Rm9ybSApXG5cdFx0XHRcdC5vbiggXCJmb2N1c2luLnZhbGlkYXRlIGZvY3Vzb3V0LnZhbGlkYXRlIGtleXVwLnZhbGlkYXRlXCIsXG5cdFx0XHRcdFx0XCI6dGV4dCwgW3R5cGU9J3Bhc3N3b3JkJ10sIFt0eXBlPSdmaWxlJ10sIHNlbGVjdCwgdGV4dGFyZWEsIFt0eXBlPSdudW1iZXInXSwgW3R5cGU9J3NlYXJjaCddLCBcIiArXG5cdFx0XHRcdFx0XCJbdHlwZT0ndGVsJ10sIFt0eXBlPSd1cmwnXSwgW3R5cGU9J2VtYWlsJ10sIFt0eXBlPSdkYXRldGltZSddLCBbdHlwZT0nZGF0ZSddLCBbdHlwZT0nbW9udGgnXSwgXCIgK1xuXHRcdFx0XHRcdFwiW3R5cGU9J3dlZWsnXSwgW3R5cGU9J3RpbWUnXSwgW3R5cGU9J2RhdGV0aW1lLWxvY2FsJ10sIFt0eXBlPSdyYW5nZSddLCBbdHlwZT0nY29sb3InXSwgXCIgK1xuXHRcdFx0XHRcdFwiW3R5cGU9J3JhZGlvJ10sIFt0eXBlPSdjaGVja2JveCddLCBbY29udGVudGVkaXRhYmxlXSwgW3R5cGU9J2J1dHRvbiddXCIsIGRlbGVnYXRlIClcblxuXHRcdFx0XHQvLyBTdXBwb3J0OiBDaHJvbWUsIG9sZElFXG5cdFx0XHRcdC8vIFwic2VsZWN0XCIgaXMgcHJvdmlkZWQgYXMgZXZlbnQudGFyZ2V0IHdoZW4gY2xpY2tpbmcgYSBvcHRpb25cblx0XHRcdFx0Lm9uKCBcImNsaWNrLnZhbGlkYXRlXCIsIFwic2VsZWN0LCBvcHRpb24sIFt0eXBlPSdyYWRpbyddLCBbdHlwZT0nY2hlY2tib3gnXVwiLCBkZWxlZ2F0ZSApO1xuXG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MuaW52YWxpZEhhbmRsZXIgKSB7XG5cdFx0XHRcdCQoIHRoaXMuY3VycmVudEZvcm0gKS5vbiggXCJpbnZhbGlkLWZvcm0udmFsaWRhdGVcIiwgdGhpcy5zZXR0aW5ncy5pbnZhbGlkSGFuZGxlciApO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL1ZhbGlkYXRvci5mb3JtL1xuXHRcdGZvcm06IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5jaGVja0Zvcm0oKTtcblx0XHRcdCQuZXh0ZW5kKCB0aGlzLnN1Ym1pdHRlZCwgdGhpcy5lcnJvck1hcCApO1xuXHRcdFx0dGhpcy5pbnZhbGlkID0gJC5leHRlbmQoIHt9LCB0aGlzLmVycm9yTWFwICk7XG5cdFx0XHRpZiAoICF0aGlzLnZhbGlkKCkgKSB7XG5cdFx0XHRcdCQoIHRoaXMuY3VycmVudEZvcm0gKS50cmlnZ2VySGFuZGxlciggXCJpbnZhbGlkLWZvcm1cIiwgWyB0aGlzIF0gKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuc2hvd0Vycm9ycygpO1xuXHRcdFx0cmV0dXJuIHRoaXMudmFsaWQoKTtcblx0XHR9LFxuXG5cdFx0Y2hlY2tGb3JtOiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMucHJlcGFyZUZvcm0oKTtcblx0XHRcdGZvciAoIHZhciBpID0gMCwgZWxlbWVudHMgPSAoIHRoaXMuY3VycmVudEVsZW1lbnRzID0gdGhpcy5lbGVtZW50cygpICk7IGVsZW1lbnRzWyBpIF07IGkrKyApIHtcblx0XHRcdFx0dGhpcy5jaGVjayggZWxlbWVudHNbIGkgXSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRoaXMudmFsaWQoKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9WYWxpZGF0b3IuZWxlbWVudC9cblx0XHRlbGVtZW50OiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdHZhciBjbGVhbkVsZW1lbnQgPSB0aGlzLmNsZWFuKCBlbGVtZW50ICksXG5cdFx0XHRcdGNoZWNrRWxlbWVudCA9IHRoaXMudmFsaWRhdGlvblRhcmdldEZvciggY2xlYW5FbGVtZW50ICksXG5cdFx0XHRcdHYgPSB0aGlzLFxuXHRcdFx0XHRyZXN1bHQgPSB0cnVlLFxuXHRcdFx0XHRycywgZ3JvdXA7XG5cblx0XHRcdGlmICggY2hlY2tFbGVtZW50ID09PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRcdGRlbGV0ZSB0aGlzLmludmFsaWRbIGNsZWFuRWxlbWVudC5uYW1lIF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnByZXBhcmVFbGVtZW50KCBjaGVja0VsZW1lbnQgKTtcblx0XHRcdFx0dGhpcy5jdXJyZW50RWxlbWVudHMgPSAkKCBjaGVja0VsZW1lbnQgKTtcblxuXHRcdFx0XHQvLyBJZiB0aGlzIGVsZW1lbnQgaXMgZ3JvdXBlZCwgdGhlbiB2YWxpZGF0ZSBhbGwgZ3JvdXAgZWxlbWVudHMgYWxyZWFkeVxuXHRcdFx0XHQvLyBjb250YWluaW5nIGEgdmFsdWVcblx0XHRcdFx0Z3JvdXAgPSB0aGlzLmdyb3Vwc1sgY2hlY2tFbGVtZW50Lm5hbWUgXTtcblx0XHRcdFx0aWYgKCBncm91cCApIHtcblx0XHRcdFx0XHQkLmVhY2goIHRoaXMuZ3JvdXBzLCBmdW5jdGlvbiggbmFtZSwgdGVzdGdyb3VwICkge1xuXHRcdFx0XHRcdFx0aWYgKCB0ZXN0Z3JvdXAgPT09IGdyb3VwICYmIG5hbWUgIT09IGNoZWNrRWxlbWVudC5uYW1lICkge1xuXHRcdFx0XHRcdFx0XHRjbGVhbkVsZW1lbnQgPSB2LnZhbGlkYXRpb25UYXJnZXRGb3IoIHYuY2xlYW4oIHYuZmluZEJ5TmFtZSggbmFtZSApICkgKTtcblx0XHRcdFx0XHRcdFx0aWYgKCBjbGVhbkVsZW1lbnQgJiYgY2xlYW5FbGVtZW50Lm5hbWUgaW4gdi5pbnZhbGlkICkge1xuXHRcdFx0XHRcdFx0XHRcdHYuY3VycmVudEVsZW1lbnRzLnB1c2goIGNsZWFuRWxlbWVudCApO1xuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdCA9IHYuY2hlY2soIGNsZWFuRWxlbWVudCApICYmIHJlc3VsdDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJzID0gdGhpcy5jaGVjayggY2hlY2tFbGVtZW50ICkgIT09IGZhbHNlO1xuXHRcdFx0XHRyZXN1bHQgPSByZXN1bHQgJiYgcnM7XG5cdFx0XHRcdGlmICggcnMgKSB7XG5cdFx0XHRcdFx0dGhpcy5pbnZhbGlkWyBjaGVja0VsZW1lbnQubmFtZSBdID0gZmFsc2U7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5pbnZhbGlkWyBjaGVja0VsZW1lbnQubmFtZSBdID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICggIXRoaXMubnVtYmVyT2ZJbnZhbGlkcygpICkge1xuXG5cdFx0XHRcdFx0Ly8gSGlkZSBlcnJvciBjb250YWluZXJzIG9uIGxhc3QgZXJyb3Jcblx0XHRcdFx0XHR0aGlzLnRvSGlkZSA9IHRoaXMudG9IaWRlLmFkZCggdGhpcy5jb250YWluZXJzICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy5zaG93RXJyb3JzKCk7XG5cblx0XHRcdFx0Ly8gQWRkIGFyaWEtaW52YWxpZCBzdGF0dXMgZm9yIHNjcmVlbiByZWFkZXJzXG5cdFx0XHRcdCQoIGVsZW1lbnQgKS5hdHRyKCBcImFyaWEtaW52YWxpZFwiLCAhcnMgKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9WYWxpZGF0b3Iuc2hvd0Vycm9ycy9cblx0XHRzaG93RXJyb3JzOiBmdW5jdGlvbiggZXJyb3JzICkge1xuXHRcdFx0aWYgKCBlcnJvcnMgKSB7XG5cdFx0XHRcdHZhciB2YWxpZGF0b3IgPSB0aGlzO1xuXG5cdFx0XHRcdC8vIEFkZCBpdGVtcyB0byBlcnJvciBsaXN0IGFuZCBtYXBcblx0XHRcdFx0JC5leHRlbmQoIHRoaXMuZXJyb3JNYXAsIGVycm9ycyApO1xuXHRcdFx0XHR0aGlzLmVycm9yTGlzdCA9ICQubWFwKCB0aGlzLmVycm9yTWFwLCBmdW5jdGlvbiggbWVzc2FnZSwgbmFtZSApIHtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0bWVzc2FnZTogbWVzc2FnZSxcblx0XHRcdFx0XHRcdGVsZW1lbnQ6IHZhbGlkYXRvci5maW5kQnlOYW1lKCBuYW1lIClbIDAgXVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH0gKTtcblxuXHRcdFx0XHQvLyBSZW1vdmUgaXRlbXMgZnJvbSBzdWNjZXNzIGxpc3Rcblx0XHRcdFx0dGhpcy5zdWNjZXNzTGlzdCA9ICQuZ3JlcCggdGhpcy5zdWNjZXNzTGlzdCwgZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHRcdFx0cmV0dXJuICEoIGVsZW1lbnQubmFtZSBpbiBlcnJvcnMgKTtcblx0XHRcdFx0fSApO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLnNob3dFcnJvcnMgKSB7XG5cdFx0XHRcdHRoaXMuc2V0dGluZ3Muc2hvd0Vycm9ycy5jYWxsKCB0aGlzLCB0aGlzLmVycm9yTWFwLCB0aGlzLmVycm9yTGlzdCApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5kZWZhdWx0U2hvd0Vycm9ycygpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL1ZhbGlkYXRvci5yZXNldEZvcm0vXG5cdFx0cmVzZXRGb3JtOiBmdW5jdGlvbigpIHtcblx0XHRcdGlmICggJC5mbi5yZXNldEZvcm0gKSB7XG5cdFx0XHRcdCQoIHRoaXMuY3VycmVudEZvcm0gKS5yZXNldEZvcm0oKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuaW52YWxpZCA9IHt9O1xuXHRcdFx0dGhpcy5zdWJtaXR0ZWQgPSB7fTtcblx0XHRcdHRoaXMucHJlcGFyZUZvcm0oKTtcblx0XHRcdHRoaXMuaGlkZUVycm9ycygpO1xuXHRcdFx0dmFyIGVsZW1lbnRzID0gdGhpcy5lbGVtZW50cygpXG5cdFx0XHRcdC5yZW1vdmVEYXRhKCBcInByZXZpb3VzVmFsdWVcIiApXG5cdFx0XHRcdC5yZW1vdmVBdHRyKCBcImFyaWEtaW52YWxpZFwiICk7XG5cblx0XHRcdHRoaXMucmVzZXRFbGVtZW50cyggZWxlbWVudHMgKTtcblx0XHR9LFxuXG5cdFx0cmVzZXRFbGVtZW50czogZnVuY3Rpb24oIGVsZW1lbnRzICkge1xuXHRcdFx0dmFyIGk7XG5cblx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy51bmhpZ2hsaWdodCApIHtcblx0XHRcdFx0Zm9yICggaSA9IDA7IGVsZW1lbnRzWyBpIF07IGkrKyApIHtcblx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLnVuaGlnaGxpZ2h0LmNhbGwoIHRoaXMsIGVsZW1lbnRzWyBpIF0sXG5cdFx0XHRcdFx0XHR0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3MsIFwiXCIgKTtcblx0XHRcdFx0XHR0aGlzLmZpbmRCeU5hbWUoIGVsZW1lbnRzWyBpIF0ubmFtZSApLnJlbW92ZUNsYXNzKCB0aGlzLnNldHRpbmdzLnZhbGlkQ2xhc3MgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZWxlbWVudHNcblx0XHRcdFx0XHQucmVtb3ZlQ2xhc3MoIHRoaXMuc2V0dGluZ3MuZXJyb3JDbGFzcyApXG5cdFx0XHRcdFx0LnJlbW92ZUNsYXNzKCB0aGlzLnNldHRpbmdzLnZhbGlkQ2xhc3MgKTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0bnVtYmVyT2ZJbnZhbGlkczogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5vYmplY3RMZW5ndGgoIHRoaXMuaW52YWxpZCApO1xuXHRcdH0sXG5cblx0XHRvYmplY3RMZW5ndGg6IGZ1bmN0aW9uKCBvYmogKSB7XG5cdFx0XHQvKiBqc2hpbnQgdW51c2VkOiBmYWxzZSAqL1xuXHRcdFx0dmFyIGNvdW50ID0gMCxcblx0XHRcdFx0aTtcblx0XHRcdGZvciAoIGkgaW4gb2JqICkge1xuXG5cdFx0XHRcdC8vIFRoaXMgY2hlY2sgYWxsb3dzIGNvdW50aW5nIGVsZW1lbnRzIHdpdGggZW1wdHkgZXJyb3Jcblx0XHRcdFx0Ly8gbWVzc2FnZSBhcyBpbnZhbGlkIGVsZW1lbnRzXG5cdFx0XHRcdGlmICggb2JqWyBpIF0gIT09IHVuZGVmaW5lZCAmJiBvYmpbIGkgXSAhPT0gbnVsbCAmJiBvYmpbIGkgXSAhPT0gZmFsc2UgKSB7XG5cdFx0XHRcdFx0Y291bnQrKztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGNvdW50O1xuXHRcdH0sXG5cblx0XHRoaWRlRXJyb3JzOiBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuaGlkZVRoZXNlKCB0aGlzLnRvSGlkZSApO1xuXHRcdH0sXG5cblx0XHRoaWRlVGhlc2U6IGZ1bmN0aW9uKCBlcnJvcnMgKSB7XG5cdFx0XHRlcnJvcnMubm90KCB0aGlzLmNvbnRhaW5lcnMgKS50ZXh0KCBcIlwiICk7XG5cdFx0XHR0aGlzLmFkZFdyYXBwZXIoIGVycm9ycyApLmhpZGUoKTtcblx0XHR9LFxuXG5cdFx0dmFsaWQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc2l6ZSgpID09PSAwO1xuXHRcdH0sXG5cblx0XHRzaXplOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0aGlzLmVycm9yTGlzdC5sZW5ndGg7XG5cdFx0fSxcblxuXHRcdGZvY3VzSW52YWxpZDogZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MuZm9jdXNJbnZhbGlkICkge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdCQoIHRoaXMuZmluZExhc3RBY3RpdmUoKSB8fCB0aGlzLmVycm9yTGlzdC5sZW5ndGggJiYgdGhpcy5lcnJvckxpc3RbIDAgXS5lbGVtZW50IHx8IFtdIClcblx0XHRcdFx0XHQuZmlsdGVyKCBcIjp2aXNpYmxlXCIgKVxuXHRcdFx0XHRcdC50cmlnZ2VyKCBcImZvY3VzXCIgKVxuXG5cdFx0XHRcdFx0Ly8gTWFudWFsbHkgdHJpZ2dlciBmb2N1c2luIGV2ZW50OyB3aXRob3V0IGl0LCBmb2N1c2luIGhhbmRsZXIgaXNuJ3QgY2FsbGVkLCBmaW5kTGFzdEFjdGl2ZSB3b24ndCBoYXZlIGFueXRoaW5nIHRvIGZpbmRcblx0XHRcdFx0XHQudHJpZ2dlciggXCJmb2N1c2luXCIgKTtcblx0XHRcdFx0fSBjYXRjaCAoIGUgKSB7XG5cblx0XHRcdFx0XHQvLyBJZ25vcmUgSUUgdGhyb3dpbmcgZXJyb3JzIHdoZW4gZm9jdXNpbmcgaGlkZGVuIGVsZW1lbnRzXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0ZmluZExhc3RBY3RpdmU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGxhc3RBY3RpdmUgPSB0aGlzLmxhc3RBY3RpdmU7XG5cdFx0XHRyZXR1cm4gbGFzdEFjdGl2ZSAmJiAkLmdyZXAoIHRoaXMuZXJyb3JMaXN0LCBmdW5jdGlvbiggbiApIHtcblx0XHRcdFx0cmV0dXJuIG4uZWxlbWVudC5uYW1lID09PSBsYXN0QWN0aXZlLm5hbWU7XG5cdFx0XHR9ICkubGVuZ3RoID09PSAxICYmIGxhc3RBY3RpdmU7XG5cdFx0fSxcblxuXHRcdGVsZW1lbnRzOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciB2YWxpZGF0b3IgPSB0aGlzLFxuXHRcdFx0XHRydWxlc0NhY2hlID0ge307XG5cblx0XHRcdC8vIFNlbGVjdCBhbGwgdmFsaWQgaW5wdXRzIGluc2lkZSB0aGUgZm9ybSAobm8gc3VibWl0IG9yIHJlc2V0IGJ1dHRvbnMpXG5cdFx0XHRyZXR1cm4gJCggdGhpcy5jdXJyZW50Rm9ybSApXG5cdFx0XHQuZmluZCggXCJpbnB1dCwgc2VsZWN0LCB0ZXh0YXJlYSwgW2NvbnRlbnRlZGl0YWJsZV1cIiApXG5cdFx0XHQubm90KCBcIjpzdWJtaXQsIDpyZXNldCwgOmltYWdlLCA6ZGlzYWJsZWRcIiApXG5cdFx0XHQubm90KCB0aGlzLnNldHRpbmdzLmlnbm9yZSApXG5cdFx0XHQuZmlsdGVyKCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIG5hbWUgPSB0aGlzLm5hbWUgfHwgJCggdGhpcyApLmF0dHIoIFwibmFtZVwiICk7IC8vIEZvciBjb250ZW50ZWRpdGFibGVcblx0XHRcdFx0dmFyIGlzQ29udGVudEVkaXRhYmxlID0gdHlwZW9mICQoIHRoaXMgKS5hdHRyKCBcImNvbnRlbnRlZGl0YWJsZVwiICkgIT09IFwidW5kZWZpbmVkXCIgJiYgJCggdGhpcyApLmF0dHIoIFwiY29udGVudGVkaXRhYmxlXCIgKSAhPT0gXCJmYWxzZVwiO1xuXG5cdFx0XHRcdGlmICggIW5hbWUgJiYgdmFsaWRhdG9yLnNldHRpbmdzLmRlYnVnICYmIHdpbmRvdy5jb25zb2xlICkge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoIFwiJW8gaGFzIG5vIG5hbWUgYXNzaWduZWRcIiwgdGhpcyApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gU2V0IGZvcm0gZXhwYW5kbyBvbiBjb250ZW50ZWRpdGFibGVcblx0XHRcdFx0aWYgKCBpc0NvbnRlbnRFZGl0YWJsZSApIHtcblx0XHRcdFx0XHR0aGlzLmZvcm0gPSAkKCB0aGlzICkuY2xvc2VzdCggXCJmb3JtXCIgKVsgMCBdO1xuXHRcdFx0XHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBJZ25vcmUgZWxlbWVudHMgdGhhdCBiZWxvbmcgdG8gb3RoZXIvbmVzdGVkIGZvcm1zXG5cdFx0XHRcdGlmICggdGhpcy5mb3JtICE9PSB2YWxpZGF0b3IuY3VycmVudEZvcm0gKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gU2VsZWN0IG9ubHkgdGhlIGZpcnN0IGVsZW1lbnQgZm9yIGVhY2ggbmFtZSwgYW5kIG9ubHkgdGhvc2Ugd2l0aCBydWxlcyBzcGVjaWZpZWRcblx0XHRcdFx0aWYgKCBuYW1lIGluIHJ1bGVzQ2FjaGUgfHwgIXZhbGlkYXRvci5vYmplY3RMZW5ndGgoICQoIHRoaXMgKS5ydWxlcygpICkgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cnVsZXNDYWNoZVsgbmFtZSBdID0gdHJ1ZTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9ICk7XG5cdFx0fSxcblxuXHRcdGNsZWFuOiBmdW5jdGlvbiggc2VsZWN0b3IgKSB7XG5cdFx0XHRyZXR1cm4gJCggc2VsZWN0b3IgKVsgMCBdO1xuXHRcdH0sXG5cblx0XHRlcnJvcnM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGVycm9yQ2xhc3MgPSB0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3Muc3BsaXQoIFwiIFwiICkuam9pbiggXCIuXCIgKTtcblx0XHRcdHJldHVybiAkKCB0aGlzLnNldHRpbmdzLmVycm9yRWxlbWVudCArIFwiLlwiICsgZXJyb3JDbGFzcywgdGhpcy5lcnJvckNvbnRleHQgKTtcblx0XHR9LFxuXG5cdFx0cmVzZXRJbnRlcm5hbHM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5zdWNjZXNzTGlzdCA9IFtdO1xuXHRcdFx0dGhpcy5lcnJvckxpc3QgPSBbXTtcblx0XHRcdHRoaXMuZXJyb3JNYXAgPSB7fTtcblx0XHRcdHRoaXMudG9TaG93ID0gJCggW10gKTtcblx0XHRcdHRoaXMudG9IaWRlID0gJCggW10gKTtcblx0XHR9LFxuXG5cdFx0cmVzZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5yZXNldEludGVybmFscygpO1xuXHRcdFx0dGhpcy5jdXJyZW50RWxlbWVudHMgPSAkKCBbXSApO1xuXHRcdH0sXG5cblx0XHRwcmVwYXJlRm9ybTogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnJlc2V0KCk7XG5cdFx0XHR0aGlzLnRvSGlkZSA9IHRoaXMuZXJyb3JzKCkuYWRkKCB0aGlzLmNvbnRhaW5lcnMgKTtcblx0XHR9LFxuXG5cdFx0cHJlcGFyZUVsZW1lbnQ6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0dGhpcy5yZXNldCgpO1xuXHRcdFx0dGhpcy50b0hpZGUgPSB0aGlzLmVycm9yc0ZvciggZWxlbWVudCApO1xuXHRcdH0sXG5cblx0XHRlbGVtZW50VmFsdWU6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0dmFyICRlbGVtZW50ID0gJCggZWxlbWVudCApLFxuXHRcdFx0XHR0eXBlID0gZWxlbWVudC50eXBlLFxuXHRcdFx0XHRpc0NvbnRlbnRFZGl0YWJsZSA9IHR5cGVvZiAkZWxlbWVudC5hdHRyKCBcImNvbnRlbnRlZGl0YWJsZVwiICkgIT09IFwidW5kZWZpbmVkXCIgJiYgJGVsZW1lbnQuYXR0ciggXCJjb250ZW50ZWRpdGFibGVcIiApICE9PSBcImZhbHNlXCIsXG5cdFx0XHRcdHZhbCwgaWR4O1xuXG5cdFx0XHRpZiAoIHR5cGUgPT09IFwicmFkaW9cIiB8fCB0eXBlID09PSBcImNoZWNrYm94XCIgKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmZpbmRCeU5hbWUoIGVsZW1lbnQubmFtZSApLmZpbHRlciggXCI6Y2hlY2tlZFwiICkudmFsKCk7XG5cdFx0XHR9IGVsc2UgaWYgKCB0eXBlID09PSBcIm51bWJlclwiICYmIHR5cGVvZiBlbGVtZW50LnZhbGlkaXR5ICE9PSBcInVuZGVmaW5lZFwiICkge1xuXHRcdFx0XHRyZXR1cm4gZWxlbWVudC52YWxpZGl0eS5iYWRJbnB1dCA/IFwiTmFOXCIgOiAkZWxlbWVudC52YWwoKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCBpc0NvbnRlbnRFZGl0YWJsZSApIHtcblx0XHRcdFx0dmFsID0gJGVsZW1lbnQudGV4dCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFsID0gJGVsZW1lbnQudmFsKCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICggdHlwZSA9PT0gXCJmaWxlXCIgKSB7XG5cblx0XHRcdFx0Ly8gTW9kZXJuIGJyb3dzZXIgKGNocm9tZSAmIHNhZmFyaSlcblx0XHRcdFx0aWYgKCB2YWwuc3Vic3RyKCAwLCAxMiApID09PSBcIkM6XFxcXGZha2VwYXRoXFxcXFwiICkge1xuXHRcdFx0XHRcdHJldHVybiB2YWwuc3Vic3RyKCAxMiApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gTGVnYWN5IGJyb3dzZXJzXG5cdFx0XHRcdC8vIFVuaXgtYmFzZWQgcGF0aFxuXHRcdFx0XHRpZHggPSB2YWwubGFzdEluZGV4T2YoIFwiL1wiICk7XG5cdFx0XHRcdGlmICggaWR4ID49IDAgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHZhbC5zdWJzdHIoIGlkeCArIDEgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFdpbmRvd3MtYmFzZWQgcGF0aFxuXHRcdFx0XHRpZHggPSB2YWwubGFzdEluZGV4T2YoIFwiXFxcXFwiICk7XG5cdFx0XHRcdGlmICggaWR4ID49IDAgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHZhbC5zdWJzdHIoIGlkeCArIDEgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEp1c3QgdGhlIGZpbGUgbmFtZVxuXHRcdFx0XHRyZXR1cm4gdmFsO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRcdHJldHVybiB2YWwucmVwbGFjZSggL1xcci9nLCBcIlwiICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdmFsO1xuXHRcdH0sXG5cblx0XHRjaGVjazogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHRlbGVtZW50ID0gdGhpcy52YWxpZGF0aW9uVGFyZ2V0Rm9yKCB0aGlzLmNsZWFuKCBlbGVtZW50ICkgKTtcblxuXHRcdFx0dmFyIHJ1bGVzID0gJCggZWxlbWVudCApLnJ1bGVzKCksXG5cdFx0XHRcdHJ1bGVzQ291bnQgPSAkLm1hcCggcnVsZXMsIGZ1bmN0aW9uKCBuLCBpICkge1xuXHRcdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0XHR9ICkubGVuZ3RoLFxuXHRcdFx0XHRkZXBlbmRlbmN5TWlzbWF0Y2ggPSBmYWxzZSxcblx0XHRcdFx0dmFsID0gdGhpcy5lbGVtZW50VmFsdWUoIGVsZW1lbnQgKSxcblx0XHRcdFx0cmVzdWx0LCBtZXRob2QsIHJ1bGUsIG5vcm1hbGl6ZXI7XG5cblx0XHRcdC8vIFByaW9yaXRpemUgdGhlIGxvY2FsIG5vcm1hbGl6ZXIgZGVmaW5lZCBmb3IgdGhpcyBlbGVtZW50IG92ZXIgdGhlIGdsb2JhbCBvbmVcblx0XHRcdC8vIGlmIHRoZSBmb3JtZXIgZXhpc3RzLCBvdGhlcndpc2UgdXNlciB0aGUgZ2xvYmFsIG9uZSBpbiBjYXNlIGl0IGV4aXN0cy5cblx0XHRcdGlmICggdHlwZW9mIHJ1bGVzLm5vcm1hbGl6ZXIgPT09IFwiZnVuY3Rpb25cIiApIHtcblx0XHRcdFx0bm9ybWFsaXplciA9IHJ1bGVzLm5vcm1hbGl6ZXI7XG5cdFx0XHR9IGVsc2UgaWYgKFx0dHlwZW9mIHRoaXMuc2V0dGluZ3Mubm9ybWFsaXplciA9PT0gXCJmdW5jdGlvblwiICkge1xuXHRcdFx0XHRub3JtYWxpemVyID0gdGhpcy5zZXR0aW5ncy5ub3JtYWxpemVyO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiBub3JtYWxpemVyIGlzIGRlZmluZWQsIHRoZW4gY2FsbCBpdCB0byByZXRyZWl2ZSB0aGUgY2hhbmdlZCB2YWx1ZSBpbnN0ZWFkXG5cdFx0XHQvLyBvZiB1c2luZyB0aGUgcmVhbCBvbmUuXG5cdFx0XHQvLyBOb3RlIHRoYXQgYHRoaXNgIGluIHRoZSBub3JtYWxpemVyIGlzIGBlbGVtZW50YC5cblx0XHRcdGlmICggbm9ybWFsaXplciApIHtcblx0XHRcdFx0dmFsID0gbm9ybWFsaXplci5jYWxsKCBlbGVtZW50LCB2YWwgKTtcblxuXHRcdFx0XHQvLyBEZWxldGUgdGhlIG5vcm1hbGl6ZXIgZnJvbSBydWxlcyB0byBhdm9pZCB0cmVhdGluZyBpdCBhcyBhIHByZS1kZWZpbmVkIG1ldGhvZC5cblx0XHRcdFx0ZGVsZXRlIHJ1bGVzLm5vcm1hbGl6ZXI7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAoIG1ldGhvZCBpbiBydWxlcyApIHtcblx0XHRcdFx0cnVsZSA9IHsgbWV0aG9kOiBtZXRob2QsIHBhcmFtZXRlcnM6IHJ1bGVzWyBtZXRob2QgXSB9O1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHJlc3VsdCA9ICQudmFsaWRhdG9yLm1ldGhvZHNbIG1ldGhvZCBdLmNhbGwoIHRoaXMsIHZhbCwgZWxlbWVudCwgcnVsZS5wYXJhbWV0ZXJzICk7XG5cblx0XHRcdFx0XHQvLyBJZiBhIG1ldGhvZCBpbmRpY2F0ZXMgdGhhdCB0aGUgZmllbGQgaXMgb3B0aW9uYWwgYW5kIHRoZXJlZm9yZSB2YWxpZCxcblx0XHRcdFx0XHQvLyBkb24ndCBtYXJrIGl0IGFzIHZhbGlkIHdoZW4gdGhlcmUgYXJlIG5vIG90aGVyIHJ1bGVzXG5cdFx0XHRcdFx0aWYgKCByZXN1bHQgPT09IFwiZGVwZW5kZW5jeS1taXNtYXRjaFwiICYmIHJ1bGVzQ291bnQgPT09IDEgKSB7XG5cdFx0XHRcdFx0XHRkZXBlbmRlbmN5TWlzbWF0Y2ggPSB0cnVlO1xuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRlcGVuZGVuY3lNaXNtYXRjaCA9IGZhbHNlO1xuXG5cdFx0XHRcdFx0aWYgKCByZXN1bHQgPT09IFwicGVuZGluZ1wiICkge1xuXHRcdFx0XHRcdFx0dGhpcy50b0hpZGUgPSB0aGlzLnRvSGlkZS5ub3QoIHRoaXMuZXJyb3JzRm9yKCBlbGVtZW50ICkgKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoICFyZXN1bHQgKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmZvcm1hdEFuZEFkZCggZWxlbWVudCwgcnVsZSApO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBjYXRjaCAoIGUgKSB7XG5cdFx0XHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLmRlYnVnICYmIHdpbmRvdy5jb25zb2xlICkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coIFwiRXhjZXB0aW9uIG9jY3VycmVkIHdoZW4gY2hlY2tpbmcgZWxlbWVudCBcIiArIGVsZW1lbnQuaWQgKyBcIiwgY2hlY2sgdGhlICdcIiArIHJ1bGUubWV0aG9kICsgXCInIG1ldGhvZC5cIiwgZSApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoIGUgaW5zdGFuY2VvZiBUeXBlRXJyb3IgKSB7XG5cdFx0XHRcdFx0XHRlLm1lc3NhZ2UgKz0gXCIuICBFeGNlcHRpb24gb2NjdXJyZWQgd2hlbiBjaGVja2luZyBlbGVtZW50IFwiICsgZWxlbWVudC5pZCArIFwiLCBjaGVjayB0aGUgJ1wiICsgcnVsZS5tZXRob2QgKyBcIicgbWV0aG9kLlwiO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHRocm93IGU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICggZGVwZW5kZW5jeU1pc21hdGNoICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRpZiAoIHRoaXMub2JqZWN0TGVuZ3RoKCBydWxlcyApICkge1xuXHRcdFx0XHR0aGlzLnN1Y2Nlc3NMaXN0LnB1c2goIGVsZW1lbnQgKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0sXG5cblx0XHQvLyBSZXR1cm4gdGhlIGN1c3RvbSBtZXNzYWdlIGZvciB0aGUgZ2l2ZW4gZWxlbWVudCBhbmQgdmFsaWRhdGlvbiBtZXRob2Rcblx0XHQvLyBzcGVjaWZpZWQgaW4gdGhlIGVsZW1lbnQncyBIVE1MNSBkYXRhIGF0dHJpYnV0ZVxuXHRcdC8vIHJldHVybiB0aGUgZ2VuZXJpYyBtZXNzYWdlIGlmIHByZXNlbnQgYW5kIG5vIG1ldGhvZCBzcGVjaWZpYyBtZXNzYWdlIGlzIHByZXNlbnRcblx0XHRjdXN0b21EYXRhTWVzc2FnZTogZnVuY3Rpb24oIGVsZW1lbnQsIG1ldGhvZCApIHtcblx0XHRcdHJldHVybiAkKCBlbGVtZW50ICkuZGF0YSggXCJtc2dcIiArIG1ldGhvZC5jaGFyQXQoIDAgKS50b1VwcGVyQ2FzZSgpICtcblx0XHRcdFx0bWV0aG9kLnN1YnN0cmluZyggMSApLnRvTG93ZXJDYXNlKCkgKSB8fCAkKCBlbGVtZW50ICkuZGF0YSggXCJtc2dcIiApO1xuXHRcdH0sXG5cblx0XHQvLyBSZXR1cm4gdGhlIGN1c3RvbSBtZXNzYWdlIGZvciB0aGUgZ2l2ZW4gZWxlbWVudCBuYW1lIGFuZCB2YWxpZGF0aW9uIG1ldGhvZFxuXHRcdGN1c3RvbU1lc3NhZ2U6IGZ1bmN0aW9uKCBuYW1lLCBtZXRob2QgKSB7XG5cdFx0XHR2YXIgbSA9IHRoaXMuc2V0dGluZ3MubWVzc2FnZXNbIG5hbWUgXTtcblx0XHRcdHJldHVybiBtICYmICggbS5jb25zdHJ1Y3RvciA9PT0gU3RyaW5nID8gbSA6IG1bIG1ldGhvZCBdICk7XG5cdFx0fSxcblxuXHRcdC8vIFJldHVybiB0aGUgZmlyc3QgZGVmaW5lZCBhcmd1bWVudCwgYWxsb3dpbmcgZW1wdHkgc3RyaW5nc1xuXHRcdGZpbmREZWZpbmVkOiBmdW5jdGlvbigpIHtcblx0XHRcdGZvciAoIHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKyApIHtcblx0XHRcdFx0aWYgKCBhcmd1bWVudHNbIGkgXSAhPT0gdW5kZWZpbmVkICkge1xuXHRcdFx0XHRcdHJldHVybiBhcmd1bWVudHNbIGkgXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9LFxuXG5cdFx0Ly8gVGhlIHNlY29uZCBwYXJhbWV0ZXIgJ3J1bGUnIHVzZWQgdG8gYmUgYSBzdHJpbmcsIGFuZCBleHRlbmRlZCB0byBhbiBvYmplY3QgbGl0ZXJhbFxuXHRcdC8vIG9mIHRoZSBmb2xsb3dpbmcgZm9ybTpcblx0XHQvLyBydWxlID0ge1xuXHRcdC8vICAgICBtZXRob2Q6IFwibWV0aG9kIG5hbWVcIixcblx0XHQvLyAgICAgcGFyYW1ldGVyczogXCJ0aGUgZ2l2ZW4gbWV0aG9kIHBhcmFtZXRlcnNcIlxuXHRcdC8vIH1cblx0XHQvL1xuXHRcdC8vIFRoZSBvbGQgYmVoYXZpb3Igc3RpbGwgc3VwcG9ydGVkLCBrZXB0IHRvIG1haW50YWluIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgd2l0aFxuXHRcdC8vIG9sZCBjb2RlLCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIHRoZSBuZXh0IG1ham9yIHJlbGVhc2UuXG5cdFx0ZGVmYXVsdE1lc3NhZ2U6IGZ1bmN0aW9uKCBlbGVtZW50LCBydWxlICkge1xuXHRcdFx0aWYgKCB0eXBlb2YgcnVsZSA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdFx0cnVsZSA9IHsgbWV0aG9kOiBydWxlIH07XG5cdFx0XHR9XG5cblx0XHRcdHZhciBtZXNzYWdlID0gdGhpcy5maW5kRGVmaW5lZChcblx0XHRcdFx0XHR0aGlzLmN1c3RvbU1lc3NhZ2UoIGVsZW1lbnQubmFtZSwgcnVsZS5tZXRob2QgKSxcblx0XHRcdFx0XHR0aGlzLmN1c3RvbURhdGFNZXNzYWdlKCBlbGVtZW50LCBydWxlLm1ldGhvZCApLFxuXG5cdFx0XHRcdFx0Ly8gJ3RpdGxlJyBpcyBuZXZlciB1bmRlZmluZWQsIHNvIGhhbmRsZSBlbXB0eSBzdHJpbmcgYXMgdW5kZWZpbmVkXG5cdFx0XHRcdFx0IXRoaXMuc2V0dGluZ3MuaWdub3JlVGl0bGUgJiYgZWxlbWVudC50aXRsZSB8fCB1bmRlZmluZWQsXG5cdFx0XHRcdFx0JC52YWxpZGF0b3IubWVzc2FnZXNbIHJ1bGUubWV0aG9kIF0sXG5cdFx0XHRcdFx0XCI8c3Ryb25nPldhcm5pbmc6IE5vIG1lc3NhZ2UgZGVmaW5lZCBmb3IgXCIgKyBlbGVtZW50Lm5hbWUgKyBcIjwvc3Ryb25nPlwiXG5cdFx0XHRcdCksXG5cdFx0XHRcdHRoZXJlZ2V4ID0gL1xcJD9cXHsoXFxkKylcXH0vZztcblx0XHRcdGlmICggdHlwZW9mIG1lc3NhZ2UgPT09IFwiZnVuY3Rpb25cIiApIHtcblx0XHRcdFx0bWVzc2FnZSA9IG1lc3NhZ2UuY2FsbCggdGhpcywgcnVsZS5wYXJhbWV0ZXJzLCBlbGVtZW50ICk7XG5cdFx0XHR9IGVsc2UgaWYgKCB0aGVyZWdleC50ZXN0KCBtZXNzYWdlICkgKSB7XG5cdFx0XHRcdG1lc3NhZ2UgPSAkLnZhbGlkYXRvci5mb3JtYXQoIG1lc3NhZ2UucmVwbGFjZSggdGhlcmVnZXgsIFwieyQxfVwiICksIHJ1bGUucGFyYW1ldGVycyApO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbWVzc2FnZTtcblx0XHR9LFxuXG5cdFx0Zm9ybWF0QW5kQWRkOiBmdW5jdGlvbiggZWxlbWVudCwgcnVsZSApIHtcblx0XHRcdHZhciBtZXNzYWdlID0gdGhpcy5kZWZhdWx0TWVzc2FnZSggZWxlbWVudCwgcnVsZSApO1xuXG5cdFx0XHR0aGlzLmVycm9yTGlzdC5wdXNoKCB7XG5cdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UsXG5cdFx0XHRcdGVsZW1lbnQ6IGVsZW1lbnQsXG5cdFx0XHRcdG1ldGhvZDogcnVsZS5tZXRob2Rcblx0XHRcdH0gKTtcblxuXHRcdFx0dGhpcy5lcnJvck1hcFsgZWxlbWVudC5uYW1lIF0gPSBtZXNzYWdlO1xuXHRcdFx0dGhpcy5zdWJtaXR0ZWRbIGVsZW1lbnQubmFtZSBdID0gbWVzc2FnZTtcblx0XHR9LFxuXG5cdFx0YWRkV3JhcHBlcjogZnVuY3Rpb24oIHRvVG9nZ2xlICkge1xuXHRcdFx0aWYgKCB0aGlzLnNldHRpbmdzLndyYXBwZXIgKSB7XG5cdFx0XHRcdHRvVG9nZ2xlID0gdG9Ub2dnbGUuYWRkKCB0b1RvZ2dsZS5wYXJlbnQoIHRoaXMuc2V0dGluZ3Mud3JhcHBlciApICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdG9Ub2dnbGU7XG5cdFx0fSxcblxuXHRcdGRlZmF1bHRTaG93RXJyb3JzOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBpLCBlbGVtZW50cywgZXJyb3I7XG5cdFx0XHRmb3IgKCBpID0gMDsgdGhpcy5lcnJvckxpc3RbIGkgXTsgaSsrICkge1xuXHRcdFx0XHRlcnJvciA9IHRoaXMuZXJyb3JMaXN0WyBpIF07XG5cdFx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy5oaWdobGlnaHQgKSB7XG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5oaWdobGlnaHQuY2FsbCggdGhpcywgZXJyb3IuZWxlbWVudCwgdGhpcy5zZXR0aW5ncy5lcnJvckNsYXNzLCB0aGlzLnNldHRpbmdzLnZhbGlkQ2xhc3MgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLnNob3dMYWJlbCggZXJyb3IuZWxlbWVudCwgZXJyb3IubWVzc2FnZSApO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCB0aGlzLmVycm9yTGlzdC5sZW5ndGggKSB7XG5cdFx0XHRcdHRoaXMudG9TaG93ID0gdGhpcy50b1Nob3cuYWRkKCB0aGlzLmNvbnRhaW5lcnMgKTtcblx0XHRcdH1cblx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy5zdWNjZXNzICkge1xuXHRcdFx0XHRmb3IgKCBpID0gMDsgdGhpcy5zdWNjZXNzTGlzdFsgaSBdOyBpKysgKSB7XG5cdFx0XHRcdFx0dGhpcy5zaG93TGFiZWwoIHRoaXMuc3VjY2Vzc0xpc3RbIGkgXSApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MudW5oaWdobGlnaHQgKSB7XG5cdFx0XHRcdGZvciAoIGkgPSAwLCBlbGVtZW50cyA9IHRoaXMudmFsaWRFbGVtZW50cygpOyBlbGVtZW50c1sgaSBdOyBpKysgKSB7XG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy51bmhpZ2hsaWdodC5jYWxsKCB0aGlzLCBlbGVtZW50c1sgaSBdLCB0aGlzLnNldHRpbmdzLmVycm9yQ2xhc3MsIHRoaXMuc2V0dGluZ3MudmFsaWRDbGFzcyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnRvSGlkZSA9IHRoaXMudG9IaWRlLm5vdCggdGhpcy50b1Nob3cgKTtcblx0XHRcdHRoaXMuaGlkZUVycm9ycygpO1xuXHRcdFx0dGhpcy5hZGRXcmFwcGVyKCB0aGlzLnRvU2hvdyApLnNob3coKTtcblx0XHR9LFxuXG5cdFx0dmFsaWRFbGVtZW50czogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5jdXJyZW50RWxlbWVudHMubm90KCB0aGlzLmludmFsaWRFbGVtZW50cygpICk7XG5cdFx0fSxcblxuXHRcdGludmFsaWRFbGVtZW50czogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gJCggdGhpcy5lcnJvckxpc3QgKS5tYXAoIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5lbGVtZW50O1xuXHRcdFx0fSApO1xuXHRcdH0sXG5cblx0XHRzaG93TGFiZWw6IGZ1bmN0aW9uKCBlbGVtZW50LCBtZXNzYWdlICkge1xuXHRcdFx0dmFyIHBsYWNlLCBncm91cCwgZXJyb3JJRCwgdixcblx0XHRcdFx0ZXJyb3IgPSB0aGlzLmVycm9yc0ZvciggZWxlbWVudCApLFxuXHRcdFx0XHRlbGVtZW50SUQgPSB0aGlzLmlkT3JOYW1lKCBlbGVtZW50ICksXG5cdFx0XHRcdGRlc2NyaWJlZEJ5ID0gJCggZWxlbWVudCApLmF0dHIoIFwiYXJpYS1kZXNjcmliZWRieVwiICk7XG5cblx0XHRcdGlmICggZXJyb3IubGVuZ3RoICkge1xuXG5cdFx0XHRcdC8vIFJlZnJlc2ggZXJyb3Ivc3VjY2VzcyBjbGFzc1xuXHRcdFx0XHRlcnJvci5yZW1vdmVDbGFzcyggdGhpcy5zZXR0aW5ncy52YWxpZENsYXNzICkuYWRkQ2xhc3MoIHRoaXMuc2V0dGluZ3MuZXJyb3JDbGFzcyApO1xuXG5cdFx0XHRcdC8vIFJlcGxhY2UgbWVzc2FnZSBvbiBleGlzdGluZyBsYWJlbFxuXHRcdFx0XHRlcnJvci5odG1sKCBtZXNzYWdlICk7XG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdC8vIENyZWF0ZSBlcnJvciBlbGVtZW50XG5cdFx0XHRcdGVycm9yID0gJCggXCI8XCIgKyB0aGlzLnNldHRpbmdzLmVycm9yRWxlbWVudCArIFwiPlwiIClcblx0XHRcdFx0XHQuYXR0ciggXCJpZFwiLCBlbGVtZW50SUQgKyBcIi1lcnJvclwiIClcblx0XHRcdFx0XHQuYWRkQ2xhc3MoIHRoaXMuc2V0dGluZ3MuZXJyb3JDbGFzcyApXG5cdFx0XHRcdFx0Lmh0bWwoIG1lc3NhZ2UgfHwgXCJcIiApO1xuXG5cdFx0XHRcdC8vIE1haW50YWluIHJlZmVyZW5jZSB0byB0aGUgZWxlbWVudCB0byBiZSBwbGFjZWQgaW50byB0aGUgRE9NXG5cdFx0XHRcdHBsYWNlID0gZXJyb3I7XG5cdFx0XHRcdGlmICggdGhpcy5zZXR0aW5ncy53cmFwcGVyICkge1xuXG5cdFx0XHRcdFx0Ly8gTWFrZSBzdXJlIHRoZSBlbGVtZW50IGlzIHZpc2libGUsIGV2ZW4gaW4gSUVcblx0XHRcdFx0XHQvLyBhY3R1YWxseSBzaG93aW5nIHRoZSB3cmFwcGVkIGVsZW1lbnQgaXMgaGFuZGxlZCBlbHNld2hlcmVcblx0XHRcdFx0XHRwbGFjZSA9IGVycm9yLmhpZGUoKS5zaG93KCkud3JhcCggXCI8XCIgKyB0aGlzLnNldHRpbmdzLndyYXBwZXIgKyBcIi8+XCIgKS5wYXJlbnQoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIHRoaXMubGFiZWxDb250YWluZXIubGVuZ3RoICkge1xuXHRcdFx0XHRcdHRoaXMubGFiZWxDb250YWluZXIuYXBwZW5kKCBwbGFjZSApO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCB0aGlzLnNldHRpbmdzLmVycm9yUGxhY2VtZW50ICkge1xuXHRcdFx0XHRcdHRoaXMuc2V0dGluZ3MuZXJyb3JQbGFjZW1lbnQuY2FsbCggdGhpcywgcGxhY2UsICQoIGVsZW1lbnQgKSApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHBsYWNlLmluc2VydEFmdGVyKCBlbGVtZW50ICk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBMaW5rIGVycm9yIGJhY2sgdG8gdGhlIGVsZW1lbnRcblx0XHRcdFx0aWYgKCBlcnJvci5pcyggXCJsYWJlbFwiICkgKSB7XG5cblx0XHRcdFx0XHQvLyBJZiB0aGUgZXJyb3IgaXMgYSBsYWJlbCwgdGhlbiBhc3NvY2lhdGUgdXNpbmcgJ2Zvcidcblx0XHRcdFx0XHRlcnJvci5hdHRyKCBcImZvclwiLCBlbGVtZW50SUQgKTtcblxuXHRcdFx0XHRcdC8vIElmIHRoZSBlbGVtZW50IGlzIG5vdCBhIGNoaWxkIG9mIGFuIGFzc29jaWF0ZWQgbGFiZWwsIHRoZW4gaXQncyBuZWNlc3Nhcnlcblx0XHRcdFx0XHQvLyB0byBleHBsaWNpdGx5IGFwcGx5IGFyaWEtZGVzY3JpYmVkYnlcblx0XHRcdFx0fSBlbHNlIGlmICggZXJyb3IucGFyZW50cyggXCJsYWJlbFtmb3I9J1wiICsgdGhpcy5lc2NhcGVDc3NNZXRhKCBlbGVtZW50SUQgKSArIFwiJ11cIiApLmxlbmd0aCA9PT0gMCApIHtcblx0XHRcdFx0XHRlcnJvcklEID0gZXJyb3IuYXR0ciggXCJpZFwiICk7XG5cblx0XHRcdFx0XHQvLyBSZXNwZWN0IGV4aXN0aW5nIG5vbi1lcnJvciBhcmlhLWRlc2NyaWJlZGJ5XG5cdFx0XHRcdFx0aWYgKCAhZGVzY3JpYmVkQnkgKSB7XG5cdFx0XHRcdFx0XHRkZXNjcmliZWRCeSA9IGVycm9ySUQ7XG5cdFx0XHRcdFx0fSBlbHNlIGlmICggIWRlc2NyaWJlZEJ5Lm1hdGNoKCBuZXcgUmVnRXhwKCBcIlxcXFxiXCIgKyB0aGlzLmVzY2FwZUNzc01ldGEoIGVycm9ySUQgKSArIFwiXFxcXGJcIiApICkgKSB7XG5cblx0XHRcdFx0XHRcdC8vIEFkZCB0byBlbmQgb2YgbGlzdCBpZiBub3QgYWxyZWFkeSBwcmVzZW50XG5cdFx0XHRcdFx0XHRkZXNjcmliZWRCeSArPSBcIiBcIiArIGVycm9ySUQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdCQoIGVsZW1lbnQgKS5hdHRyKCBcImFyaWEtZGVzY3JpYmVkYnlcIiwgZGVzY3JpYmVkQnkgKTtcblxuXHRcdFx0XHRcdC8vIElmIHRoaXMgZWxlbWVudCBpcyBncm91cGVkLCB0aGVuIGFzc2lnbiB0byBhbGwgZWxlbWVudHMgaW4gdGhlIHNhbWUgZ3JvdXBcblx0XHRcdFx0XHRncm91cCA9IHRoaXMuZ3JvdXBzWyBlbGVtZW50Lm5hbWUgXTtcblx0XHRcdFx0XHRpZiAoIGdyb3VwICkge1xuXHRcdFx0XHRcdFx0diA9IHRoaXM7XG5cdFx0XHRcdFx0XHQkLmVhY2goIHYuZ3JvdXBzLCBmdW5jdGlvbiggbmFtZSwgdGVzdGdyb3VwICkge1xuXHRcdFx0XHRcdFx0XHRpZiAoIHRlc3Rncm91cCA9PT0gZ3JvdXAgKSB7XG5cdFx0XHRcdFx0XHRcdFx0JCggXCJbbmFtZT0nXCIgKyB2LmVzY2FwZUNzc01ldGEoIG5hbWUgKSArIFwiJ11cIiwgdi5jdXJyZW50Rm9ybSApXG5cdFx0XHRcdFx0XHRcdFx0XHQuYXR0ciggXCJhcmlhLWRlc2NyaWJlZGJ5XCIsIGVycm9yLmF0dHIoIFwiaWRcIiApICk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0gKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICggIW1lc3NhZ2UgJiYgdGhpcy5zZXR0aW5ncy5zdWNjZXNzICkge1xuXHRcdFx0XHRlcnJvci50ZXh0KCBcIlwiICk7XG5cdFx0XHRcdGlmICggdHlwZW9mIHRoaXMuc2V0dGluZ3Muc3VjY2VzcyA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdFx0XHRlcnJvci5hZGRDbGFzcyggdGhpcy5zZXR0aW5ncy5zdWNjZXNzICk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5zdWNjZXNzKCBlcnJvciwgZWxlbWVudCApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnRvU2hvdyA9IHRoaXMudG9TaG93LmFkZCggZXJyb3IgKTtcblx0XHR9LFxuXG5cdFx0ZXJyb3JzRm9yOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdHZhciBuYW1lID0gdGhpcy5lc2NhcGVDc3NNZXRhKCB0aGlzLmlkT3JOYW1lKCBlbGVtZW50ICkgKSxcblx0XHRcdFx0ZGVzY3JpYmVyID0gJCggZWxlbWVudCApLmF0dHIoIFwiYXJpYS1kZXNjcmliZWRieVwiICksXG5cdFx0XHRcdHNlbGVjdG9yID0gXCJsYWJlbFtmb3I9J1wiICsgbmFtZSArIFwiJ10sIGxhYmVsW2Zvcj0nXCIgKyBuYW1lICsgXCInXSAqXCI7XG5cblx0XHRcdC8vICdhcmlhLWRlc2NyaWJlZGJ5JyBzaG91bGQgZGlyZWN0bHkgcmVmZXJlbmNlIHRoZSBlcnJvciBlbGVtZW50XG5cdFx0XHRpZiAoIGRlc2NyaWJlciApIHtcblx0XHRcdFx0c2VsZWN0b3IgPSBzZWxlY3RvciArIFwiLCAjXCIgKyB0aGlzLmVzY2FwZUNzc01ldGEoIGRlc2NyaWJlciApXG5cdFx0XHRcdFx0LnJlcGxhY2UoIC9cXHMrL2csIFwiLCAjXCIgKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRoaXNcblx0XHRcdFx0LmVycm9ycygpXG5cdFx0XHRcdC5maWx0ZXIoIHNlbGVjdG9yICk7XG5cdFx0fSxcblxuXHRcdC8vIFNlZSBodHRwczovL2FwaS5qcXVlcnkuY29tL2NhdGVnb3J5L3NlbGVjdG9ycy8sIGZvciBDU1Ncblx0XHQvLyBtZXRhLWNoYXJhY3RlcnMgdGhhdCBzaG91bGQgYmUgZXNjYXBlZCBpbiBvcmRlciB0byBiZSB1c2VkIHdpdGggSlF1ZXJ5XG5cdFx0Ly8gYXMgYSBsaXRlcmFsIHBhcnQgb2YgYSBuYW1lL2lkIG9yIGFueSBzZWxlY3Rvci5cblx0XHRlc2NhcGVDc3NNZXRhOiBmdW5jdGlvbiggc3RyaW5nICkge1xuXHRcdFx0cmV0dXJuIHN0cmluZy5yZXBsYWNlKCAvKFtcXFxcIVwiIyQlJicoKSorLC4vOjs8PT4/QFxcW1xcXV5ge3x9fl0pL2csIFwiXFxcXCQxXCIgKTtcblx0XHR9LFxuXG5cdFx0aWRPck5hbWU6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdFx0cmV0dXJuIHRoaXMuZ3JvdXBzWyBlbGVtZW50Lm5hbWUgXSB8fCAoIHRoaXMuY2hlY2thYmxlKCBlbGVtZW50ICkgPyBlbGVtZW50Lm5hbWUgOiBlbGVtZW50LmlkIHx8IGVsZW1lbnQubmFtZSApO1xuXHRcdH0sXG5cblx0XHR2YWxpZGF0aW9uVGFyZ2V0Rm9yOiBmdW5jdGlvbiggZWxlbWVudCApIHtcblxuXHRcdFx0Ly8gSWYgcmFkaW8vY2hlY2tib3gsIHZhbGlkYXRlIGZpcnN0IGVsZW1lbnQgaW4gZ3JvdXAgaW5zdGVhZFxuXHRcdFx0aWYgKCB0aGlzLmNoZWNrYWJsZSggZWxlbWVudCApICkge1xuXHRcdFx0XHRlbGVtZW50ID0gdGhpcy5maW5kQnlOYW1lKCBlbGVtZW50Lm5hbWUgKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQWx3YXlzIGFwcGx5IGlnbm9yZSBmaWx0ZXJcblx0XHRcdHJldHVybiAkKCBlbGVtZW50ICkubm90KCB0aGlzLnNldHRpbmdzLmlnbm9yZSApWyAwIF07XG5cdFx0fSxcblxuXHRcdGNoZWNrYWJsZTogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHRyZXR1cm4gKCAvcmFkaW98Y2hlY2tib3gvaSApLnRlc3QoIGVsZW1lbnQudHlwZSApO1xuXHRcdH0sXG5cblx0XHRmaW5kQnlOYW1lOiBmdW5jdGlvbiggbmFtZSApIHtcblx0XHRcdHJldHVybiAkKCB0aGlzLmN1cnJlbnRGb3JtICkuZmluZCggXCJbbmFtZT0nXCIgKyB0aGlzLmVzY2FwZUNzc01ldGEoIG5hbWUgKSArIFwiJ11cIiApO1xuXHRcdH0sXG5cblx0XHRnZXRMZW5ndGg6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCApIHtcblx0XHRcdHN3aXRjaCAoIGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSApIHtcblx0XHRcdGNhc2UgXCJzZWxlY3RcIjpcblx0XHRcdFx0cmV0dXJuICQoIFwib3B0aW9uOnNlbGVjdGVkXCIsIGVsZW1lbnQgKS5sZW5ndGg7XG5cdFx0XHRjYXNlIFwiaW5wdXRcIjpcblx0XHRcdFx0aWYgKCB0aGlzLmNoZWNrYWJsZSggZWxlbWVudCApICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmZpbmRCeU5hbWUoIGVsZW1lbnQubmFtZSApLmZpbHRlciggXCI6Y2hlY2tlZFwiICkubGVuZ3RoO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdmFsdWUubGVuZ3RoO1xuXHRcdH0sXG5cblx0XHRkZXBlbmQ6IGZ1bmN0aW9uKCBwYXJhbSwgZWxlbWVudCApIHtcblx0XHRcdHJldHVybiB0aGlzLmRlcGVuZFR5cGVzWyB0eXBlb2YgcGFyYW0gXSA/IHRoaXMuZGVwZW5kVHlwZXNbIHR5cGVvZiBwYXJhbSBdKCBwYXJhbSwgZWxlbWVudCApIDogdHJ1ZTtcblx0XHR9LFxuXG5cdFx0ZGVwZW5kVHlwZXM6IHtcblx0XHRcdFwiYm9vbGVhblwiOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiBwYXJhbTtcblx0XHRcdH0sXG5cdFx0XHRcInN0cmluZ1wiOiBmdW5jdGlvbiggcGFyYW0sIGVsZW1lbnQgKSB7XG5cdFx0XHRcdHJldHVybiAhISQoIHBhcmFtLCBlbGVtZW50LmZvcm0gKS5sZW5ndGg7XG5cdFx0XHR9LFxuXHRcdFx0XCJmdW5jdGlvblwiOiBmdW5jdGlvbiggcGFyYW0sIGVsZW1lbnQgKSB7XG5cdFx0XHRcdHJldHVybiBwYXJhbSggZWxlbWVudCApO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRvcHRpb25hbDogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0XHR2YXIgdmFsID0gdGhpcy5lbGVtZW50VmFsdWUoIGVsZW1lbnQgKTtcblx0XHRcdHJldHVybiAhJC52YWxpZGF0b3IubWV0aG9kcy5yZXF1aXJlZC5jYWxsKCB0aGlzLCB2YWwsIGVsZW1lbnQgKSAmJiBcImRlcGVuZGVuY3ktbWlzbWF0Y2hcIjtcblx0XHR9LFxuXG5cdFx0c3RhcnRSZXF1ZXN0OiBmdW5jdGlvbiggZWxlbWVudCApIHtcblx0XHRcdGlmICggIXRoaXMucGVuZGluZ1sgZWxlbWVudC5uYW1lIF0gKSB7XG5cdFx0XHRcdHRoaXMucGVuZGluZ1JlcXVlc3QrKztcblx0XHRcdFx0JCggZWxlbWVudCApLmFkZENsYXNzKCB0aGlzLnNldHRpbmdzLnBlbmRpbmdDbGFzcyApO1xuXHRcdFx0XHR0aGlzLnBlbmRpbmdbIGVsZW1lbnQubmFtZSBdID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0c3RvcFJlcXVlc3Q6IGZ1bmN0aW9uKCBlbGVtZW50LCB2YWxpZCApIHtcblx0XHRcdHRoaXMucGVuZGluZ1JlcXVlc3QtLTtcblxuXHRcdFx0Ly8gU29tZXRpbWVzIHN5bmNocm9uaXphdGlvbiBmYWlscywgbWFrZSBzdXJlIHBlbmRpbmdSZXF1ZXN0IGlzIG5ldmVyIDwgMFxuXHRcdFx0aWYgKCB0aGlzLnBlbmRpbmdSZXF1ZXN0IDwgMCApIHtcblx0XHRcdFx0dGhpcy5wZW5kaW5nUmVxdWVzdCA9IDA7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGUgdGhpcy5wZW5kaW5nWyBlbGVtZW50Lm5hbWUgXTtcblx0XHRcdCQoIGVsZW1lbnQgKS5yZW1vdmVDbGFzcyggdGhpcy5zZXR0aW5ncy5wZW5kaW5nQ2xhc3MgKTtcblx0XHRcdGlmICggdmFsaWQgJiYgdGhpcy5wZW5kaW5nUmVxdWVzdCA9PT0gMCAmJiB0aGlzLmZvcm1TdWJtaXR0ZWQgJiYgdGhpcy5mb3JtKCkgKSB7XG5cdFx0XHRcdCQoIHRoaXMuY3VycmVudEZvcm0gKS5zdWJtaXQoKTtcblxuXHRcdFx0XHQvLyBSZW1vdmUgdGhlIGhpZGRlbiBpbnB1dCB0aGF0IHdhcyB1c2VkIGFzIGEgcmVwbGFjZW1lbnQgZm9yIHRoZVxuXHRcdFx0XHQvLyBtaXNzaW5nIHN1Ym1pdCBidXR0b24uIFRoZSBoaWRkZW4gaW5wdXQgaXMgYWRkZWQgYnkgYGhhbmRsZSgpYFxuXHRcdFx0XHQvLyB0byBlbnN1cmUgdGhhdCB0aGUgdmFsdWUgb2YgdGhlIHVzZWQgc3VibWl0IGJ1dHRvbiBpcyBwYXNzZWQgb25cblx0XHRcdFx0Ly8gZm9yIHNjcmlwdGVkIHN1Ym1pdHMgdHJpZ2dlcmVkIGJ5IHRoaXMgbWV0aG9kXG5cdFx0XHRcdGlmICggdGhpcy5zdWJtaXRCdXR0b24gKSB7XG5cdFx0XHRcdFx0JCggXCJpbnB1dDpoaWRkZW5bbmFtZT0nXCIgKyB0aGlzLnN1Ym1pdEJ1dHRvbi5uYW1lICsgXCInXVwiLCB0aGlzLmN1cnJlbnRGb3JtICkucmVtb3ZlKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLmZvcm1TdWJtaXR0ZWQgPSBmYWxzZTtcblx0XHRcdH0gZWxzZSBpZiAoICF2YWxpZCAmJiB0aGlzLnBlbmRpbmdSZXF1ZXN0ID09PSAwICYmIHRoaXMuZm9ybVN1Ym1pdHRlZCApIHtcblx0XHRcdFx0JCggdGhpcy5jdXJyZW50Rm9ybSApLnRyaWdnZXJIYW5kbGVyKCBcImludmFsaWQtZm9ybVwiLCBbIHRoaXMgXSApO1xuXHRcdFx0XHR0aGlzLmZvcm1TdWJtaXR0ZWQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0cHJldmlvdXNWYWx1ZTogZnVuY3Rpb24oIGVsZW1lbnQsIG1ldGhvZCApIHtcblx0XHRcdG1ldGhvZCA9IHR5cGVvZiBtZXRob2QgPT09IFwic3RyaW5nXCIgJiYgbWV0aG9kIHx8IFwicmVtb3RlXCI7XG5cblx0XHRcdHJldHVybiAkLmRhdGEoIGVsZW1lbnQsIFwicHJldmlvdXNWYWx1ZVwiICkgfHwgJC5kYXRhKCBlbGVtZW50LCBcInByZXZpb3VzVmFsdWVcIiwge1xuXHRcdFx0XHRvbGQ6IG51bGwsXG5cdFx0XHRcdHZhbGlkOiB0cnVlLFxuXHRcdFx0XHRtZXNzYWdlOiB0aGlzLmRlZmF1bHRNZXNzYWdlKCBlbGVtZW50LCB7IG1ldGhvZDogbWV0aG9kIH0gKVxuXHRcdFx0fSApO1xuXHRcdH0sXG5cblx0XHQvLyBDbGVhbnMgdXAgYWxsIGZvcm1zIGFuZCBlbGVtZW50cywgcmVtb3ZlcyB2YWxpZGF0b3Itc3BlY2lmaWMgZXZlbnRzXG5cdFx0ZGVzdHJveTogZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnJlc2V0Rm9ybSgpO1xuXG5cdFx0XHQkKCB0aGlzLmN1cnJlbnRGb3JtIClcblx0XHRcdFx0Lm9mZiggXCIudmFsaWRhdGVcIiApXG5cdFx0XHRcdC5yZW1vdmVEYXRhKCBcInZhbGlkYXRvclwiIClcblx0XHRcdFx0LmZpbmQoIFwiLnZhbGlkYXRlLWVxdWFsVG8tYmx1clwiIClcblx0XHRcdFx0XHQub2ZmKCBcIi52YWxpZGF0ZS1lcXVhbFRvXCIgKVxuXHRcdFx0XHRcdC5yZW1vdmVDbGFzcyggXCJ2YWxpZGF0ZS1lcXVhbFRvLWJsdXJcIiApXG5cdFx0XHRcdC5maW5kKCBcIi52YWxpZGF0ZS1sZXNzVGhhbi1ibHVyXCIgKVxuXHRcdFx0XHRcdC5vZmYoIFwiLnZhbGlkYXRlLWxlc3NUaGFuXCIgKVxuXHRcdFx0XHRcdC5yZW1vdmVDbGFzcyggXCJ2YWxpZGF0ZS1sZXNzVGhhbi1ibHVyXCIgKVxuXHRcdFx0XHQuZmluZCggXCIudmFsaWRhdGUtbGVzc1RoYW5FcXVhbC1ibHVyXCIgKVxuXHRcdFx0XHRcdC5vZmYoIFwiLnZhbGlkYXRlLWxlc3NUaGFuRXF1YWxcIiApXG5cdFx0XHRcdFx0LnJlbW92ZUNsYXNzKCBcInZhbGlkYXRlLWxlc3NUaGFuRXF1YWwtYmx1clwiIClcblx0XHRcdFx0LmZpbmQoIFwiLnZhbGlkYXRlLWdyZWF0ZXJUaGFuRXF1YWwtYmx1clwiIClcblx0XHRcdFx0XHQub2ZmKCBcIi52YWxpZGF0ZS1ncmVhdGVyVGhhbkVxdWFsXCIgKVxuXHRcdFx0XHRcdC5yZW1vdmVDbGFzcyggXCJ2YWxpZGF0ZS1ncmVhdGVyVGhhbkVxdWFsLWJsdXJcIiApXG5cdFx0XHRcdC5maW5kKCBcIi52YWxpZGF0ZS1ncmVhdGVyVGhhbi1ibHVyXCIgKVxuXHRcdFx0XHRcdC5vZmYoIFwiLnZhbGlkYXRlLWdyZWF0ZXJUaGFuXCIgKVxuXHRcdFx0XHRcdC5yZW1vdmVDbGFzcyggXCJ2YWxpZGF0ZS1ncmVhdGVyVGhhbi1ibHVyXCIgKTtcblx0XHR9XG5cblx0fSxcblxuXHRjbGFzc1J1bGVTZXR0aW5nczoge1xuXHRcdHJlcXVpcmVkOiB7IHJlcXVpcmVkOiB0cnVlIH0sXG5cdFx0ZW1haWw6IHsgZW1haWw6IHRydWUgfSxcblx0XHR1cmw6IHsgdXJsOiB0cnVlIH0sXG5cdFx0ZGF0ZTogeyBkYXRlOiB0cnVlIH0sXG5cdFx0ZGF0ZUlTTzogeyBkYXRlSVNPOiB0cnVlIH0sXG5cdFx0bnVtYmVyOiB7IG51bWJlcjogdHJ1ZSB9LFxuXHRcdGRpZ2l0czogeyBkaWdpdHM6IHRydWUgfSxcblx0XHRjcmVkaXRjYXJkOiB7IGNyZWRpdGNhcmQ6IHRydWUgfVxuXHR9LFxuXG5cdGFkZENsYXNzUnVsZXM6IGZ1bmN0aW9uKCBjbGFzc05hbWUsIHJ1bGVzICkge1xuXHRcdGlmICggY2xhc3NOYW1lLmNvbnN0cnVjdG9yID09PSBTdHJpbmcgKSB7XG5cdFx0XHR0aGlzLmNsYXNzUnVsZVNldHRpbmdzWyBjbGFzc05hbWUgXSA9IHJ1bGVzO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkLmV4dGVuZCggdGhpcy5jbGFzc1J1bGVTZXR0aW5ncywgY2xhc3NOYW1lICk7XG5cdFx0fVxuXHR9LFxuXG5cdGNsYXNzUnVsZXM6IGZ1bmN0aW9uKCBlbGVtZW50ICkge1xuXHRcdHZhciBydWxlcyA9IHt9LFxuXHRcdFx0Y2xhc3NlcyA9ICQoIGVsZW1lbnQgKS5hdHRyKCBcImNsYXNzXCIgKTtcblxuXHRcdGlmICggY2xhc3NlcyApIHtcblx0XHRcdCQuZWFjaCggY2xhc3Nlcy5zcGxpdCggXCIgXCIgKSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICggdGhpcyBpbiAkLnZhbGlkYXRvci5jbGFzc1J1bGVTZXR0aW5ncyApIHtcblx0XHRcdFx0XHQkLmV4dGVuZCggcnVsZXMsICQudmFsaWRhdG9yLmNsYXNzUnVsZVNldHRpbmdzWyB0aGlzIF0gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSApO1xuXHRcdH1cblx0XHRyZXR1cm4gcnVsZXM7XG5cdH0sXG5cblx0bm9ybWFsaXplQXR0cmlidXRlUnVsZTogZnVuY3Rpb24oIHJ1bGVzLCB0eXBlLCBtZXRob2QsIHZhbHVlICkge1xuXG5cdFx0Ly8gQ29udmVydCB0aGUgdmFsdWUgdG8gYSBudW1iZXIgZm9yIG51bWJlciBpbnB1dHMsIGFuZCBmb3IgdGV4dCBmb3IgYmFja3dhcmRzIGNvbXBhYmlsaXR5XG5cdFx0Ly8gYWxsb3dzIHR5cGU9XCJkYXRlXCIgYW5kIG90aGVycyB0byBiZSBjb21wYXJlZCBhcyBzdHJpbmdzXG5cdFx0aWYgKCAvbWlufG1heHxzdGVwLy50ZXN0KCBtZXRob2QgKSAmJiAoIHR5cGUgPT09IG51bGwgfHwgL251bWJlcnxyYW5nZXx0ZXh0Ly50ZXN0KCB0eXBlICkgKSApIHtcblx0XHRcdHZhbHVlID0gTnVtYmVyKCB2YWx1ZSApO1xuXG5cdFx0XHQvLyBTdXBwb3J0IE9wZXJhIE1pbmksIHdoaWNoIHJldHVybnMgTmFOIGZvciB1bmRlZmluZWQgbWlubGVuZ3RoXG5cdFx0XHRpZiAoIGlzTmFOKCB2YWx1ZSApICkge1xuXHRcdFx0XHR2YWx1ZSA9IHVuZGVmaW5lZDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoIHZhbHVlIHx8IHZhbHVlID09PSAwICkge1xuXHRcdFx0cnVsZXNbIG1ldGhvZCBdID0gdmFsdWU7XG5cdFx0fSBlbHNlIGlmICggdHlwZSA9PT0gbWV0aG9kICYmIHR5cGUgIT09IFwicmFuZ2VcIiApIHtcblxuXHRcdFx0Ly8gRXhjZXB0aW9uOiB0aGUganF1ZXJ5IHZhbGlkYXRlICdyYW5nZScgbWV0aG9kXG5cdFx0XHQvLyBkb2VzIG5vdCB0ZXN0IGZvciB0aGUgaHRtbDUgJ3JhbmdlJyB0eXBlXG5cdFx0XHRydWxlc1sgbWV0aG9kIF0gPSB0cnVlO1xuXHRcdH1cblx0fSxcblxuXHRhdHRyaWJ1dGVSdWxlczogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0dmFyIHJ1bGVzID0ge30sXG5cdFx0XHQkZWxlbWVudCA9ICQoIGVsZW1lbnQgKSxcblx0XHRcdHR5cGUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSggXCJ0eXBlXCIgKSxcblx0XHRcdG1ldGhvZCwgdmFsdWU7XG5cblx0XHRmb3IgKCBtZXRob2QgaW4gJC52YWxpZGF0b3IubWV0aG9kcyApIHtcblxuXHRcdFx0Ly8gU3VwcG9ydCBmb3IgPGlucHV0IHJlcXVpcmVkPiBpbiBib3RoIGh0bWw1IGFuZCBvbGRlciBicm93c2Vyc1xuXHRcdFx0aWYgKCBtZXRob2QgPT09IFwicmVxdWlyZWRcIiApIHtcblx0XHRcdFx0dmFsdWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSggbWV0aG9kICk7XG5cblx0XHRcdFx0Ly8gU29tZSBicm93c2VycyByZXR1cm4gYW4gZW1wdHkgc3RyaW5nIGZvciB0aGUgcmVxdWlyZWQgYXR0cmlidXRlXG5cdFx0XHRcdC8vIGFuZCBub24tSFRNTDUgYnJvd3NlcnMgbWlnaHQgaGF2ZSByZXF1aXJlZD1cIlwiIG1hcmt1cFxuXHRcdFx0XHRpZiAoIHZhbHVlID09PSBcIlwiICkge1xuXHRcdFx0XHRcdHZhbHVlID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEZvcmNlIG5vbi1IVE1MNSBicm93c2VycyB0byByZXR1cm4gYm9vbFxuXHRcdFx0XHR2YWx1ZSA9ICEhdmFsdWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YWx1ZSA9ICRlbGVtZW50LmF0dHIoIG1ldGhvZCApO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLm5vcm1hbGl6ZUF0dHJpYnV0ZVJ1bGUoIHJ1bGVzLCB0eXBlLCBtZXRob2QsIHZhbHVlICk7XG5cdFx0fVxuXG5cdFx0Ly8gJ21heGxlbmd0aCcgbWF5IGJlIHJldHVybmVkIGFzIC0xLCAyMTQ3NDgzNjQ3ICggSUUgKSBhbmQgNTI0Mjg4ICggc2FmYXJpICkgZm9yIHRleHQgaW5wdXRzXG5cdFx0aWYgKCBydWxlcy5tYXhsZW5ndGggJiYgLy0xfDIxNDc0ODM2NDd8NTI0Mjg4Ly50ZXN0KCBydWxlcy5tYXhsZW5ndGggKSApIHtcblx0XHRcdGRlbGV0ZSBydWxlcy5tYXhsZW5ndGg7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJ1bGVzO1xuXHR9LFxuXG5cdGRhdGFSdWxlczogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0dmFyIHJ1bGVzID0ge30sXG5cdFx0XHQkZWxlbWVudCA9ICQoIGVsZW1lbnQgKSxcblx0XHRcdHR5cGUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSggXCJ0eXBlXCIgKSxcblx0XHRcdG1ldGhvZCwgdmFsdWU7XG5cblx0XHRmb3IgKCBtZXRob2QgaW4gJC52YWxpZGF0b3IubWV0aG9kcyApIHtcblx0XHRcdHZhbHVlID0gJGVsZW1lbnQuZGF0YSggXCJydWxlXCIgKyBtZXRob2QuY2hhckF0KCAwICkudG9VcHBlckNhc2UoKSArIG1ldGhvZC5zdWJzdHJpbmcoIDEgKS50b0xvd2VyQ2FzZSgpICk7XG5cblx0XHRcdC8vIENhc3QgZW1wdHkgYXR0cmlidXRlcyBsaWtlIGBkYXRhLXJ1bGUtcmVxdWlyZWRgIHRvIGB0cnVlYFxuXHRcdFx0aWYgKCB2YWx1ZSA9PT0gXCJcIiApIHtcblx0XHRcdFx0dmFsdWUgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLm5vcm1hbGl6ZUF0dHJpYnV0ZVJ1bGUoIHJ1bGVzLCB0eXBlLCBtZXRob2QsIHZhbHVlICk7XG5cdFx0fVxuXHRcdHJldHVybiBydWxlcztcblx0fSxcblxuXHRzdGF0aWNSdWxlczogZnVuY3Rpb24oIGVsZW1lbnQgKSB7XG5cdFx0dmFyIHJ1bGVzID0ge30sXG5cdFx0XHR2YWxpZGF0b3IgPSAkLmRhdGEoIGVsZW1lbnQuZm9ybSwgXCJ2YWxpZGF0b3JcIiApO1xuXG5cdFx0aWYgKCB2YWxpZGF0b3Iuc2V0dGluZ3MucnVsZXMgKSB7XG5cdFx0XHRydWxlcyA9ICQudmFsaWRhdG9yLm5vcm1hbGl6ZVJ1bGUoIHZhbGlkYXRvci5zZXR0aW5ncy5ydWxlc1sgZWxlbWVudC5uYW1lIF0gKSB8fCB7fTtcblx0XHR9XG5cdFx0cmV0dXJuIHJ1bGVzO1xuXHR9LFxuXG5cdG5vcm1hbGl6ZVJ1bGVzOiBmdW5jdGlvbiggcnVsZXMsIGVsZW1lbnQgKSB7XG5cblx0XHQvLyBIYW5kbGUgZGVwZW5kZW5jeSBjaGVja1xuXHRcdCQuZWFjaCggcnVsZXMsIGZ1bmN0aW9uKCBwcm9wLCB2YWwgKSB7XG5cblx0XHRcdC8vIElnbm9yZSBydWxlIHdoZW4gcGFyYW0gaXMgZXhwbGljaXRseSBmYWxzZSwgZWcuIHJlcXVpcmVkOmZhbHNlXG5cdFx0XHRpZiAoIHZhbCA9PT0gZmFsc2UgKSB7XG5cdFx0XHRcdGRlbGV0ZSBydWxlc1sgcHJvcCBdO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRpZiAoIHZhbC5wYXJhbSB8fCB2YWwuZGVwZW5kcyApIHtcblx0XHRcdFx0dmFyIGtlZXBSdWxlID0gdHJ1ZTtcblx0XHRcdFx0c3dpdGNoICggdHlwZW9mIHZhbC5kZXBlbmRzICkge1xuXHRcdFx0XHRjYXNlIFwic3RyaW5nXCI6XG5cdFx0XHRcdFx0a2VlcFJ1bGUgPSAhISQoIHZhbC5kZXBlbmRzLCBlbGVtZW50LmZvcm0gKS5sZW5ndGg7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJmdW5jdGlvblwiOlxuXHRcdFx0XHRcdGtlZXBSdWxlID0gdmFsLmRlcGVuZHMuY2FsbCggZWxlbWVudCwgZWxlbWVudCApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICgga2VlcFJ1bGUgKSB7XG5cdFx0XHRcdFx0cnVsZXNbIHByb3AgXSA9IHZhbC5wYXJhbSAhPT0gdW5kZWZpbmVkID8gdmFsLnBhcmFtIDogdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQkLmRhdGEoIGVsZW1lbnQuZm9ybSwgXCJ2YWxpZGF0b3JcIiApLnJlc2V0RWxlbWVudHMoICQoIGVsZW1lbnQgKSApO1xuXHRcdFx0XHRcdGRlbGV0ZSBydWxlc1sgcHJvcCBdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0Ly8gRXZhbHVhdGUgcGFyYW1ldGVyc1xuXHRcdCQuZWFjaCggcnVsZXMsIGZ1bmN0aW9uKCBydWxlLCBwYXJhbWV0ZXIgKSB7XG5cdFx0XHRydWxlc1sgcnVsZSBdID0gJC5pc0Z1bmN0aW9uKCBwYXJhbWV0ZXIgKSAmJiBydWxlICE9PSBcIm5vcm1hbGl6ZXJcIiA/IHBhcmFtZXRlciggZWxlbWVudCApIDogcGFyYW1ldGVyO1xuXHRcdH0gKTtcblxuXHRcdC8vIENsZWFuIG51bWJlciBwYXJhbWV0ZXJzXG5cdFx0JC5lYWNoKCBbIFwibWlubGVuZ3RoXCIsIFwibWF4bGVuZ3RoXCIgXSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoIHJ1bGVzWyB0aGlzIF0gKSB7XG5cdFx0XHRcdHJ1bGVzWyB0aGlzIF0gPSBOdW1iZXIoIHJ1bGVzWyB0aGlzIF0gKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cdFx0JC5lYWNoKCBbIFwicmFuZ2VsZW5ndGhcIiwgXCJyYW5nZVwiIF0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHBhcnRzO1xuXHRcdFx0aWYgKCBydWxlc1sgdGhpcyBdICkge1xuXHRcdFx0XHRpZiAoICQuaXNBcnJheSggcnVsZXNbIHRoaXMgXSApICkge1xuXHRcdFx0XHRcdHJ1bGVzWyB0aGlzIF0gPSBbIE51bWJlciggcnVsZXNbIHRoaXMgXVsgMCBdICksIE51bWJlciggcnVsZXNbIHRoaXMgXVsgMSBdICkgXTtcblx0XHRcdFx0fSBlbHNlIGlmICggdHlwZW9mIHJ1bGVzWyB0aGlzIF0gPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRcdFx0cGFydHMgPSBydWxlc1sgdGhpcyBdLnJlcGxhY2UoIC9bXFxbXFxdXS9nLCBcIlwiICkuc3BsaXQoIC9bXFxzLF0rLyApO1xuXHRcdFx0XHRcdHJ1bGVzWyB0aGlzIF0gPSBbIE51bWJlciggcGFydHNbIDAgXSApLCBOdW1iZXIoIHBhcnRzWyAxIF0gKSBdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSApO1xuXG5cdFx0aWYgKCAkLnZhbGlkYXRvci5hdXRvQ3JlYXRlUmFuZ2VzICkge1xuXG5cdFx0XHQvLyBBdXRvLWNyZWF0ZSByYW5nZXNcblx0XHRcdGlmICggcnVsZXMubWluICE9IG51bGwgJiYgcnVsZXMubWF4ICE9IG51bGwgKSB7XG5cdFx0XHRcdHJ1bGVzLnJhbmdlID0gWyBydWxlcy5taW4sIHJ1bGVzLm1heCBdO1xuXHRcdFx0XHRkZWxldGUgcnVsZXMubWluO1xuXHRcdFx0XHRkZWxldGUgcnVsZXMubWF4O1xuXHRcdFx0fVxuXHRcdFx0aWYgKCBydWxlcy5taW5sZW5ndGggIT0gbnVsbCAmJiBydWxlcy5tYXhsZW5ndGggIT0gbnVsbCApIHtcblx0XHRcdFx0cnVsZXMucmFuZ2VsZW5ndGggPSBbIHJ1bGVzLm1pbmxlbmd0aCwgcnVsZXMubWF4bGVuZ3RoIF07XG5cdFx0XHRcdGRlbGV0ZSBydWxlcy5taW5sZW5ndGg7XG5cdFx0XHRcdGRlbGV0ZSBydWxlcy5tYXhsZW5ndGg7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJ1bGVzO1xuXHR9LFxuXG5cdC8vIENvbnZlcnRzIGEgc2ltcGxlIHN0cmluZyB0byBhIHtzdHJpbmc6IHRydWV9IHJ1bGUsIGUuZy4sIFwicmVxdWlyZWRcIiB0byB7cmVxdWlyZWQ6dHJ1ZX1cblx0bm9ybWFsaXplUnVsZTogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0aWYgKCB0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdHZhciB0cmFuc2Zvcm1lZCA9IHt9O1xuXHRcdFx0JC5lYWNoKCBkYXRhLnNwbGl0KCAvXFxzLyApLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dHJhbnNmb3JtZWRbIHRoaXMgXSA9IHRydWU7XG5cdFx0XHR9ICk7XG5cdFx0XHRkYXRhID0gdHJhbnNmb3JtZWQ7XG5cdFx0fVxuXHRcdHJldHVybiBkYXRhO1xuXHR9LFxuXG5cdC8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvalF1ZXJ5LnZhbGlkYXRvci5hZGRNZXRob2QvXG5cdGFkZE1ldGhvZDogZnVuY3Rpb24oIG5hbWUsIG1ldGhvZCwgbWVzc2FnZSApIHtcblx0XHQkLnZhbGlkYXRvci5tZXRob2RzWyBuYW1lIF0gPSBtZXRob2Q7XG5cdFx0JC52YWxpZGF0b3IubWVzc2FnZXNbIG5hbWUgXSA9IG1lc3NhZ2UgIT09IHVuZGVmaW5lZCA/IG1lc3NhZ2UgOiAkLnZhbGlkYXRvci5tZXNzYWdlc1sgbmFtZSBdO1xuXHRcdGlmICggbWV0aG9kLmxlbmd0aCA8IDMgKSB7XG5cdFx0XHQkLnZhbGlkYXRvci5hZGRDbGFzc1J1bGVzKCBuYW1lLCAkLnZhbGlkYXRvci5ub3JtYWxpemVSdWxlKCBuYW1lICkgKTtcblx0XHR9XG5cdH0sXG5cblx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9qUXVlcnkudmFsaWRhdG9yLm1ldGhvZHMvXG5cdG1ldGhvZHM6IHtcblxuXHRcdC8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvcmVxdWlyZWQtbWV0aG9kL1xuXHRcdHJlcXVpcmVkOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQsIHBhcmFtICkge1xuXG5cdFx0XHQvLyBDaGVjayBpZiBkZXBlbmRlbmN5IGlzIG1ldFxuXHRcdFx0aWYgKCAhdGhpcy5kZXBlbmQoIHBhcmFtLCBlbGVtZW50ICkgKSB7XG5cdFx0XHRcdHJldHVybiBcImRlcGVuZGVuY3ktbWlzbWF0Y2hcIjtcblx0XHRcdH1cblx0XHRcdGlmICggZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcInNlbGVjdFwiICkge1xuXG5cdFx0XHRcdC8vIENvdWxkIGJlIGFuIGFycmF5IGZvciBzZWxlY3QtbXVsdGlwbGUgb3IgYSBzdHJpbmcsIGJvdGggYXJlIGZpbmUgdGhpcyB3YXlcblx0XHRcdFx0dmFyIHZhbCA9ICQoIGVsZW1lbnQgKS52YWwoKTtcblx0XHRcdFx0cmV0dXJuIHZhbCAmJiB2YWwubGVuZ3RoID4gMDtcblx0XHRcdH1cblx0XHRcdGlmICggdGhpcy5jaGVja2FibGUoIGVsZW1lbnQgKSApIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuZ2V0TGVuZ3RoKCB2YWx1ZSwgZWxlbWVudCApID4gMDtcblx0XHRcdH1cblx0XHRcdHJldHVybiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsICYmIHZhbHVlLmxlbmd0aCA+IDA7XG5cdFx0fSxcblxuXHRcdC8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvZW1haWwtbWV0aG9kL1xuXHRcdGVtYWlsOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQgKSB7XG5cblx0XHRcdC8vIEZyb20gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvZm9ybXMuaHRtbCN2YWxpZC1lLW1haWwtYWRkcmVzc1xuXHRcdFx0Ly8gUmV0cmlldmVkIDIwMTQtMDEtMTRcblx0XHRcdC8vIElmIHlvdSBoYXZlIGEgcHJvYmxlbSB3aXRoIHRoaXMgaW1wbGVtZW50YXRpb24sIHJlcG9ydCBhIGJ1ZyBhZ2FpbnN0IHRoZSBhYm92ZSBzcGVjXG5cdFx0XHQvLyBPciB1c2UgY3VzdG9tIG1ldGhvZHMgdG8gaW1wbGVtZW50IHlvdXIgb3duIGVtYWlsIHZhbGlkYXRpb25cblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgL15bYS16QS1aMC05LiEjJCUmJyorXFwvPT9eX2B7fH1+LV0rQFthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPyg/OlxcLlthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPykqJC8udGVzdCggdmFsdWUgKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy91cmwtbWV0aG9kL1xuXHRcdHVybDogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50ICkge1xuXG5cdFx0XHQvLyBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBEaWVnbyBQZXJpbmksIE1JVCBsaWNlbnNlZFxuXHRcdFx0Ly8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vZHBlcmluaS83MjkyOTRcblx0XHRcdC8vIHNlZSBhbHNvIGh0dHBzOi8vbWF0aGlhc2J5bmVucy5iZS9kZW1vL3VybC1yZWdleFxuXHRcdFx0Ly8gbW9kaWZpZWQgdG8gYWxsb3cgcHJvdG9jb2wtcmVsYXRpdmUgVVJMc1xuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCAvXig/Oig/Oig/Omh0dHBzP3xmdHApOik/XFwvXFwvKSg/OlxcUysoPzo6XFxTKik/QCk/KD86KD8hKD86MTB8MTI3KSg/OlxcLlxcZHsxLDN9KXszfSkoPyEoPzoxNjlcXC4yNTR8MTkyXFwuMTY4KSg/OlxcLlxcZHsxLDN9KXsyfSkoPyExNzJcXC4oPzoxWzYtOV18MlxcZHwzWzAtMV0pKD86XFwuXFxkezEsM30pezJ9KSg/OlsxLTldXFxkP3wxXFxkXFxkfDJbMDFdXFxkfDIyWzAtM10pKD86XFwuKD86MT9cXGR7MSwyfXwyWzAtNF1cXGR8MjVbMC01XSkpezJ9KD86XFwuKD86WzEtOV1cXGQ/fDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNF0pKXwoPzooPzpbYS16XFx1MDBhMS1cXHVmZmZmMC05XS0qKSpbYS16XFx1MDBhMS1cXHVmZmZmMC05XSspKD86XFwuKD86W2EtelxcdTAwYTEtXFx1ZmZmZjAtOV0tKikqW2EtelxcdTAwYTEtXFx1ZmZmZjAtOV0rKSooPzpcXC4oPzpbYS16XFx1MDBhMS1cXHVmZmZmXXsyLH0pKS4/KSg/OjpcXGR7Miw1fSk/KD86Wy8/I11cXFMqKT8kL2kudGVzdCggdmFsdWUgKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9kYXRlLW1ldGhvZC9cblx0XHRkYXRlOiAoIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGNhbGxlZCA9IGZhbHNlO1xuXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50ICkge1xuXHRcdFx0XHRpZiAoICFjYWxsZWQgKSB7XG5cdFx0XHRcdFx0Y2FsbGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3MuZGVidWcgJiYgd2luZG93LmNvbnNvbGUgKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oXG5cdFx0XHRcdFx0XHRcdFwiVGhlIGBkYXRlYCBtZXRob2QgaXMgZGVwcmVjYXRlZCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIHZlcnNpb24gJzIuMC4wJy5cXG5cIiArXG5cdFx0XHRcdFx0XHRcdFwiUGxlYXNlIGRvbid0IHVzZSBpdCwgc2luY2UgaXQgcmVsaWVzIG9uIHRoZSBEYXRlIGNvbnN0cnVjdG9yLCB3aGljaFxcblwiICtcblx0XHRcdFx0XHRcdFx0XCJiZWhhdmVzIHZlcnkgZGlmZmVyZW50bHkgYWNyb3NzIGJyb3dzZXJzIGFuZCBsb2NhbGVzLiBVc2UgYGRhdGVJU09gXFxuXCIgK1xuXHRcdFx0XHRcdFx0XHRcImluc3RlYWQgb3Igb25lIG9mIHRoZSBsb2NhbGUgc3BlY2lmaWMgbWV0aG9kcyBpbiBgbG9jYWxpemF0aW9ucy9gXFxuXCIgK1xuXHRcdFx0XHRcdFx0XHRcImFuZCBgYWRkaXRpb25hbC1tZXRob2RzLmpzYC5cIlxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8ICEvSW52YWxpZHxOYU4vLnRlc3QoIG5ldyBEYXRlKCB2YWx1ZSApLnRvU3RyaW5nKCkgKTtcblx0XHRcdH07XG5cdFx0fSgpICksXG5cblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2RhdGVJU08tbWV0aG9kL1xuXHRcdGRhdGVJU086IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCApIHtcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgL15cXGR7NH1bXFwvXFwtXSgwP1sxLTldfDFbMDEyXSlbXFwvXFwtXSgwP1sxLTldfFsxMl1bMC05XXwzWzAxXSkkLy50ZXN0KCB2YWx1ZSApO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL251bWJlci1tZXRob2QvXG5cdFx0bnVtYmVyOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQgKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IC9eKD86LT9cXGQrfC0/XFxkezEsM30oPzosXFxkezN9KSspPyg/OlxcLlxcZCspPyQvLnRlc3QoIHZhbHVlICk7XG5cdFx0fSxcblxuXHRcdC8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvZGlnaXRzLW1ldGhvZC9cblx0XHRkaWdpdHM6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCApIHtcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgL15cXGQrJC8udGVzdCggdmFsdWUgKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9taW5sZW5ndGgtbWV0aG9kL1xuXHRcdG1pbmxlbmd0aDogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50LCBwYXJhbSApIHtcblx0XHRcdHZhciBsZW5ndGggPSAkLmlzQXJyYXkoIHZhbHVlICkgPyB2YWx1ZS5sZW5ndGggOiB0aGlzLmdldExlbmd0aCggdmFsdWUsIGVsZW1lbnQgKTtcblx0XHRcdHJldHVybiB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgfHwgbGVuZ3RoID49IHBhcmFtO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL21heGxlbmd0aC1tZXRob2QvXG5cdFx0bWF4bGVuZ3RoOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQsIHBhcmFtICkge1xuXHRcdFx0dmFyIGxlbmd0aCA9ICQuaXNBcnJheSggdmFsdWUgKSA/IHZhbHVlLmxlbmd0aCA6IHRoaXMuZ2V0TGVuZ3RoKCB2YWx1ZSwgZWxlbWVudCApO1xuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCBsZW5ndGggPD0gcGFyYW07XG5cdFx0fSxcblxuXHRcdC8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvcmFuZ2VsZW5ndGgtbWV0aG9kL1xuXHRcdHJhbmdlbGVuZ3RoOiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQsIHBhcmFtICkge1xuXHRcdFx0dmFyIGxlbmd0aCA9ICQuaXNBcnJheSggdmFsdWUgKSA/IHZhbHVlLmxlbmd0aCA6IHRoaXMuZ2V0TGVuZ3RoKCB2YWx1ZSwgZWxlbWVudCApO1xuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCAoIGxlbmd0aCA+PSBwYXJhbVsgMCBdICYmIGxlbmd0aCA8PSBwYXJhbVsgMSBdICk7XG5cdFx0fSxcblxuXHRcdC8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvbWluLW1ldGhvZC9cblx0XHRtaW46IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IHZhbHVlID49IHBhcmFtO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL21heC1tZXRob2QvXG5cdFx0bWF4OiBmdW5jdGlvbiggdmFsdWUsIGVsZW1lbnQsIHBhcmFtICkge1xuXHRcdFx0cmV0dXJuIHRoaXMub3B0aW9uYWwoIGVsZW1lbnQgKSB8fCB2YWx1ZSA8PSBwYXJhbTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9yYW5nZS1tZXRob2QvXG5cdFx0cmFuZ2U6IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8ICggdmFsdWUgPj0gcGFyYW1bIDAgXSAmJiB2YWx1ZSA8PSBwYXJhbVsgMSBdICk7XG5cdFx0fSxcblxuXHRcdC8vIGh0dHBzOi8vanF1ZXJ5dmFsaWRhdGlvbi5vcmcvc3RlcC1tZXRob2QvXG5cdFx0c3RlcDogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50LCBwYXJhbSApIHtcblx0XHRcdHZhciB0eXBlID0gJCggZWxlbWVudCApLmF0dHIoIFwidHlwZVwiICksXG5cdFx0XHRcdGVycm9yTWVzc2FnZSA9IFwiU3RlcCBhdHRyaWJ1dGUgb24gaW5wdXQgdHlwZSBcIiArIHR5cGUgKyBcIiBpcyBub3Qgc3VwcG9ydGVkLlwiLFxuXHRcdFx0XHRzdXBwb3J0ZWRUeXBlcyA9IFsgXCJ0ZXh0XCIsIFwibnVtYmVyXCIsIFwicmFuZ2VcIiBdLFxuXHRcdFx0XHRyZSA9IG5ldyBSZWdFeHAoIFwiXFxcXGJcIiArIHR5cGUgKyBcIlxcXFxiXCIgKSxcblx0XHRcdFx0bm90U3VwcG9ydGVkID0gdHlwZSAmJiAhcmUudGVzdCggc3VwcG9ydGVkVHlwZXMuam9pbigpICksXG5cdFx0XHRcdGRlY2ltYWxQbGFjZXMgPSBmdW5jdGlvbiggbnVtICkge1xuXHRcdFx0XHRcdHZhciBtYXRjaCA9ICggXCJcIiArIG51bSApLm1hdGNoKCAvKD86XFwuKFxcZCspKT8kLyApO1xuXHRcdFx0XHRcdGlmICggIW1hdGNoICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gTnVtYmVyIG9mIGRpZ2l0cyByaWdodCBvZiBkZWNpbWFsIHBvaW50LlxuXHRcdFx0XHRcdHJldHVybiBtYXRjaFsgMSBdID8gbWF0Y2hbIDEgXS5sZW5ndGggOiAwO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR0b0ludCA9IGZ1bmN0aW9uKCBudW0gKSB7XG5cdFx0XHRcdFx0cmV0dXJuIE1hdGgucm91bmQoIG51bSAqIE1hdGgucG93KCAxMCwgZGVjaW1hbHMgKSApO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR2YWxpZCA9IHRydWUsXG5cdFx0XHRcdGRlY2ltYWxzO1xuXG5cdFx0XHQvLyBXb3JrcyBvbmx5IGZvciB0ZXh0LCBudW1iZXIgYW5kIHJhbmdlIGlucHV0IHR5cGVzXG5cdFx0XHQvLyBUT0RPIGZpbmQgYSB3YXkgdG8gc3VwcG9ydCBpbnB1dCB0eXBlcyBkYXRlLCBkYXRldGltZSwgZGF0ZXRpbWUtbG9jYWwsIG1vbnRoLCB0aW1lIGFuZCB3ZWVrXG5cdFx0XHRpZiAoIG5vdFN1cHBvcnRlZCApIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCBlcnJvck1lc3NhZ2UgKTtcblx0XHRcdH1cblxuXHRcdFx0ZGVjaW1hbHMgPSBkZWNpbWFsUGxhY2VzKCBwYXJhbSApO1xuXG5cdFx0XHQvLyBWYWx1ZSBjYW4ndCBoYXZlIHRvbyBtYW55IGRlY2ltYWxzXG5cdFx0XHRpZiAoIGRlY2ltYWxQbGFjZXMoIHZhbHVlICkgPiBkZWNpbWFscyB8fCB0b0ludCggdmFsdWUgKSAlIHRvSW50KCBwYXJhbSApICE9PSAwICkge1xuXHRcdFx0XHR2YWxpZCA9IGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdGhpcy5vcHRpb25hbCggZWxlbWVudCApIHx8IHZhbGlkO1xuXHRcdH0sXG5cblx0XHQvLyBodHRwczovL2pxdWVyeXZhbGlkYXRpb24ub3JnL2VxdWFsVG8tbWV0aG9kL1xuXHRcdGVxdWFsVG86IGZ1bmN0aW9uKCB2YWx1ZSwgZWxlbWVudCwgcGFyYW0gKSB7XG5cblx0XHRcdC8vIEJpbmQgdG8gdGhlIGJsdXIgZXZlbnQgb2YgdGhlIHRhcmdldCBpbiBvcmRlciB0byByZXZhbGlkYXRlIHdoZW5ldmVyIHRoZSB0YXJnZXQgZmllbGQgaXMgdXBkYXRlZFxuXHRcdFx0dmFyIHRhcmdldCA9ICQoIHBhcmFtICk7XG5cdFx0XHRpZiAoIHRoaXMuc2V0dGluZ3Mub25mb2N1c291dCAmJiB0YXJnZXQubm90KCBcIi52YWxpZGF0ZS1lcXVhbFRvLWJsdXJcIiApLmxlbmd0aCApIHtcblx0XHRcdFx0dGFyZ2V0LmFkZENsYXNzKCBcInZhbGlkYXRlLWVxdWFsVG8tYmx1clwiICkub24oIFwiYmx1ci52YWxpZGF0ZS1lcXVhbFRvXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCQoIGVsZW1lbnQgKS52YWxpZCgpO1xuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdmFsdWUgPT09IHRhcmdldC52YWwoKTtcblx0XHR9LFxuXG5cdFx0Ly8gaHR0cHM6Ly9qcXVlcnl2YWxpZGF0aW9uLm9yZy9yZW1vdGUtbWV0aG9kL1xuXHRcdHJlbW90ZTogZnVuY3Rpb24oIHZhbHVlLCBlbGVtZW50LCBwYXJhbSwgbWV0aG9kICkge1xuXHRcdFx0aWYgKCB0aGlzLm9wdGlvbmFsKCBlbGVtZW50ICkgKSB7XG5cdFx0XHRcdHJldHVybiBcImRlcGVuZGVuY3ktbWlzbWF0Y2hcIjtcblx0XHRcdH1cblxuXHRcdFx0bWV0aG9kID0gdHlwZW9mIG1ldGhvZCA9PT0gXCJzdHJpbmdcIiAmJiBtZXRob2QgfHwgXCJyZW1vdGVcIjtcblxuXHRcdFx0dmFyIHByZXZpb3VzID0gdGhpcy5wcmV2aW91c1ZhbHVlKCBlbGVtZW50LCBtZXRob2QgKSxcblx0XHRcdFx0dmFsaWRhdG9yLCBkYXRhLCBvcHRpb25EYXRhU3RyaW5nO1xuXG5cdFx0XHRpZiAoICF0aGlzLnNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXSApIHtcblx0XHRcdFx0dGhpcy5zZXR0aW5ncy5tZXNzYWdlc1sgZWxlbWVudC5uYW1lIF0gPSB7fTtcblx0XHRcdH1cblx0XHRcdHByZXZpb3VzLm9yaWdpbmFsTWVzc2FnZSA9IHByZXZpb3VzLm9yaWdpbmFsTWVzc2FnZSB8fCB0aGlzLnNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXVsgbWV0aG9kIF07XG5cdFx0XHR0aGlzLnNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXVsgbWV0aG9kIF0gPSBwcmV2aW91cy5tZXNzYWdlO1xuXG5cdFx0XHRwYXJhbSA9IHR5cGVvZiBwYXJhbSA9PT0gXCJzdHJpbmdcIiAmJiB7IHVybDogcGFyYW0gfSB8fCBwYXJhbTtcblx0XHRcdG9wdGlvbkRhdGFTdHJpbmcgPSAkLnBhcmFtKCAkLmV4dGVuZCggeyBkYXRhOiB2YWx1ZSB9LCBwYXJhbS5kYXRhICkgKTtcblx0XHRcdGlmICggcHJldmlvdXMub2xkID09PSBvcHRpb25EYXRhU3RyaW5nICkge1xuXHRcdFx0XHRyZXR1cm4gcHJldmlvdXMudmFsaWQ7XG5cdFx0XHR9XG5cblx0XHRcdHByZXZpb3VzLm9sZCA9IG9wdGlvbkRhdGFTdHJpbmc7XG5cdFx0XHR2YWxpZGF0b3IgPSB0aGlzO1xuXHRcdFx0dGhpcy5zdGFydFJlcXVlc3QoIGVsZW1lbnQgKTtcblx0XHRcdGRhdGEgPSB7fTtcblx0XHRcdGRhdGFbIGVsZW1lbnQubmFtZSBdID0gdmFsdWU7XG5cdFx0XHQkLmFqYXgoICQuZXh0ZW5kKCB0cnVlLCB7XG5cdFx0XHRcdG1vZGU6IFwiYWJvcnRcIixcblx0XHRcdFx0cG9ydDogXCJ2YWxpZGF0ZVwiICsgZWxlbWVudC5uYW1lLFxuXHRcdFx0XHRkYXRhVHlwZTogXCJqc29uXCIsXG5cdFx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRcdGNvbnRleHQ6IHZhbGlkYXRvci5jdXJyZW50Rm9ybSxcblx0XHRcdFx0c3VjY2VzczogZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuXHRcdFx0XHRcdHZhciB2YWxpZCA9IHJlc3BvbnNlID09PSB0cnVlIHx8IHJlc3BvbnNlID09PSBcInRydWVcIixcblx0XHRcdFx0XHRcdGVycm9ycywgbWVzc2FnZSwgc3VibWl0dGVkO1xuXG5cdFx0XHRcdFx0dmFsaWRhdG9yLnNldHRpbmdzLm1lc3NhZ2VzWyBlbGVtZW50Lm5hbWUgXVsgbWV0aG9kIF0gPSBwcmV2aW91cy5vcmlnaW5hbE1lc3NhZ2U7XG5cdFx0XHRcdFx0aWYgKCB2YWxpZCApIHtcblx0XHRcdFx0XHRcdHN1Ym1pdHRlZCA9IHZhbGlkYXRvci5mb3JtU3VibWl0dGVkO1xuXHRcdFx0XHRcdFx0dmFsaWRhdG9yLnJlc2V0SW50ZXJuYWxzKCk7XG5cdFx0XHRcdFx0XHR2YWxpZGF0b3IudG9IaWRlID0gdmFsaWRhdG9yLmVycm9yc0ZvciggZWxlbWVudCApO1xuXHRcdFx0XHRcdFx0dmFsaWRhdG9yLmZvcm1TdWJtaXR0ZWQgPSBzdWJtaXR0ZWQ7XG5cdFx0XHRcdFx0XHR2YWxpZGF0b3Iuc3VjY2Vzc0xpc3QucHVzaCggZWxlbWVudCApO1xuXHRcdFx0XHRcdFx0dmFsaWRhdG9yLmludmFsaWRbIGVsZW1lbnQubmFtZSBdID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR2YWxpZGF0b3Iuc2hvd0Vycm9ycygpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlcnJvcnMgPSB7fTtcblx0XHRcdFx0XHRcdG1lc3NhZ2UgPSByZXNwb25zZSB8fCB2YWxpZGF0b3IuZGVmYXVsdE1lc3NhZ2UoIGVsZW1lbnQsIHsgbWV0aG9kOiBtZXRob2QsIHBhcmFtZXRlcnM6IHZhbHVlIH0gKTtcblx0XHRcdFx0XHRcdGVycm9yc1sgZWxlbWVudC5uYW1lIF0gPSBwcmV2aW91cy5tZXNzYWdlID0gbWVzc2FnZTtcblx0XHRcdFx0XHRcdHZhbGlkYXRvci5pbnZhbGlkWyBlbGVtZW50Lm5hbWUgXSA9IHRydWU7XG5cdFx0XHRcdFx0XHR2YWxpZGF0b3Iuc2hvd0Vycm9ycyggZXJyb3JzICk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHByZXZpb3VzLnZhbGlkID0gdmFsaWQ7XG5cdFx0XHRcdFx0dmFsaWRhdG9yLnN0b3BSZXF1ZXN0KCBlbGVtZW50LCB2YWxpZCApO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCBwYXJhbSApICk7XG5cdFx0XHRyZXR1cm4gXCJwZW5kaW5nXCI7XG5cdFx0fVxuXHR9XG5cbn0gKTtcblxuLy8gQWpheCBtb2RlOiBhYm9ydFxuLy8gdXNhZ2U6ICQuYWpheCh7IG1vZGU6IFwiYWJvcnRcIlssIHBvcnQ6IFwidW5pcXVlcG9ydFwiXX0pO1xuLy8gaWYgbW9kZTpcImFib3J0XCIgaXMgdXNlZCwgdGhlIHByZXZpb3VzIHJlcXVlc3Qgb24gdGhhdCBwb3J0IChwb3J0IGNhbiBiZSB1bmRlZmluZWQpIGlzIGFib3J0ZWQgdmlhIFhNTEh0dHBSZXF1ZXN0LmFib3J0KClcblxudmFyIHBlbmRpbmdSZXF1ZXN0cyA9IHt9LFxuXHRhamF4O1xuXG4vLyBVc2UgYSBwcmVmaWx0ZXIgaWYgYXZhaWxhYmxlICgxLjUrKVxuaWYgKCAkLmFqYXhQcmVmaWx0ZXIgKSB7XG5cdCQuYWpheFByZWZpbHRlciggZnVuY3Rpb24oIHNldHRpbmdzLCBfLCB4aHIgKSB7XG5cdFx0dmFyIHBvcnQgPSBzZXR0aW5ncy5wb3J0O1xuXHRcdGlmICggc2V0dGluZ3MubW9kZSA9PT0gXCJhYm9ydFwiICkge1xuXHRcdFx0aWYgKCBwZW5kaW5nUmVxdWVzdHNbIHBvcnQgXSApIHtcblx0XHRcdFx0cGVuZGluZ1JlcXVlc3RzWyBwb3J0IF0uYWJvcnQoKTtcblx0XHRcdH1cblx0XHRcdHBlbmRpbmdSZXF1ZXN0c1sgcG9ydCBdID0geGhyO1xuXHRcdH1cblx0fSApO1xufSBlbHNlIHtcblxuXHQvLyBQcm94eSBhamF4XG5cdGFqYXggPSAkLmFqYXg7XG5cdCQuYWpheCA9IGZ1bmN0aW9uKCBzZXR0aW5ncyApIHtcblx0XHR2YXIgbW9kZSA9ICggXCJtb2RlXCIgaW4gc2V0dGluZ3MgPyBzZXR0aW5ncyA6ICQuYWpheFNldHRpbmdzICkubW9kZSxcblx0XHRcdHBvcnQgPSAoIFwicG9ydFwiIGluIHNldHRpbmdzID8gc2V0dGluZ3MgOiAkLmFqYXhTZXR0aW5ncyApLnBvcnQ7XG5cdFx0aWYgKCBtb2RlID09PSBcImFib3J0XCIgKSB7XG5cdFx0XHRpZiAoIHBlbmRpbmdSZXF1ZXN0c1sgcG9ydCBdICkge1xuXHRcdFx0XHRwZW5kaW5nUmVxdWVzdHNbIHBvcnQgXS5hYm9ydCgpO1xuXHRcdFx0fVxuXHRcdFx0cGVuZGluZ1JlcXVlc3RzWyBwb3J0IF0gPSBhamF4LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHRcdHJldHVybiBwZW5kaW5nUmVxdWVzdHNbIHBvcnQgXTtcblx0XHR9XG5cdFx0cmV0dXJuIGFqYXguYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHR9O1xufVxucmV0dXJuICQ7XG59KSk7IiwiLypcbiAqIFRyYW5zbGF0ZWQgZGVmYXVsdCBtZXNzYWdlcyBmb3IgdGhlIGpRdWVyeSB2YWxpZGF0aW9uIHBsdWdpbi5cbiAqIExvY2FsZTogUFQgKFBvcnR1Z3Vlc2U7IHBvcnR1Z3XDqnMpXG4gKiBSZWdpb246IEJSIChCcmF6aWwpXG4gKi9cbiQuZXh0ZW5kKCAkLnZhbGlkYXRvci5tZXNzYWdlcywge1xuXG5cdC8vIENvcmVcblx0cmVxdWlyZWQ6IFwiRXN0ZSBjYW1wbyAmZWFjdXRlOyByZXF1ZXJpZG8uXCIsXG5cdHJlbW90ZTogXCJQb3IgZmF2b3IsIGNvcnJpamEgZXN0ZSBjYW1wby5cIixcblx0ZW1haWw6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bSBlbmRlcmUmY2NlZGlsO28gZGUgZW1haWwgdiZhYWN1dGU7bGlkby5cIixcblx0dXJsOiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW1hIFVSTCB2JmFhY3V0ZTtsaWRhLlwiLFxuXHRkYXRlOiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW1hIGRhdGEgdiZhYWN1dGU7bGlkYS5cIixcblx0ZGF0ZUlTTzogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtYSBkYXRhIHYmYWFjdXRlO2xpZGEgKElTTykuXCIsXG5cdG51bWJlcjogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIG4mdWFjdXRlO21lcm8gdiZhYWN1dGU7bGlkby5cIixcblx0ZGlnaXRzOiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2Egc29tZW50ZSBkJmlhY3V0ZTtnaXRvcy5cIixcblx0Y3JlZGl0Y2FyZDogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIGNhcnQmYXRpbGRlO28gZGUgY3ImZWFjdXRlO2RpdG8gdiZhYWN1dGU7bGlkby5cIixcblx0ZXF1YWxUbzogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIG8gbWVzbW8gdmFsb3Igbm92YW1lbnRlLlwiLFxuXHRtYXhsZW5ndGg6ICQudmFsaWRhdG9yLmZvcm1hdCggXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIG4mYXRpbGRlO28gbWFpcyBxdWUgezB9IGNhcmFjdGVyZXMuXCIgKSxcblx0bWlubGVuZ3RoOiAkLnZhbGlkYXRvci5mb3JtYXQoIFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSBhbyBtZW5vcyB7MH0gY2FyYWN0ZXJlcy5cIiApLFxuXHRyYW5nZWxlbmd0aDogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW0gdmFsb3IgZW50cmUgezB9IGUgezF9IGNhcmFjdGVyZXMgZGUgY29tcHJpbWVudG8uXCIgKSxcblx0cmFuZ2U6ICQudmFsaWRhdG9yLmZvcm1hdCggXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIHZhbG9yIGVudHJlIHswfSBlIHsxfS5cIiApLFxuXHRtYXg6ICQudmFsaWRhdG9yLmZvcm1hdCggXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIHZhbG9yIG1lbm9yIG91IGlndWFsIGEgezB9LlwiICksXG5cdG1pbjogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW0gdmFsb3IgbWFpb3Igb3UgaWd1YWwgYSB7MH0uXCIgKSxcblx0c3RlcDogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW0gdmFsb3IgbSZ1YWN1dGU7bHRpcGxvIGRlIHswfS5cIiApLFxuXG5cdC8vIE1ldG9kb3MgQWRpY2lvbmFpc1xuXHRtYXhXb3JkczogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgY29tIHswfSBwYWxhdnJhcyBvdSBtZW5vcy5cIiApLFxuXHRtaW5Xb3JkczogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgcGVsbyBtZW5vcyB7MH0gcGFsYXZyYXMuXCIgKSxcblx0cmFuZ2VXb3JkczogJC52YWxpZGF0b3IuZm9ybWF0KCBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgZW50cmUgezB9IGUgezF9IHBhbGF2cmFzLlwiICksXG5cdGFjY2VwdDogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIHRpcG8gdiZhYWN1dGU7bGlkby5cIixcblx0YWxwaGFudW1lcmljOiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2Egc29tZW50ZSBjb20gbGV0cmFzLCBuJnVhY3V0ZTttZXJvcyBlIHN1YmxpbmhhZG9zLlwiLFxuXHRiYW5rYWNjb3VudE5MOiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgY29tIHVtIG4mdWFjdXRlO21lcm8gZGUgY29udGEgYmFuYyZhYWN1dGU7cmlhIHYmYWFjdXRlO2xpZGEuXCIsXG5cdGJhbmtvcmdpcm9hY2NvdW50Tkw6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bSBiYW5jbyB2JmFhY3V0ZTtsaWRvIG91IG4mdWFjdXRlO21lcm8gZGUgY29udGEuXCIsXG5cdGJpYzogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIGMmb2FjdXRlO2RpZ28gQklDIHYmYWFjdXRlO2xpZG8uXCIsXG5cdGNpZkVTOiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW0gYyZvYWN1dGU7ZGlnbyBDSUYgdiZhYWN1dGU7bGlkby5cIixcblx0Y3JlZGl0Y2FyZHR5cGVzOiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW0gbiZ1YWN1dGU7bWVybyBkZSBjYXJ0JmF0aWxkZTtvIGRlIGNyJmVhY3V0ZTtkaXRvIHYmYWFjdXRlO2xpZG8uXCIsXG5cdGN1cnJlbmN5OiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW1hIG1vZWRhIHYmYWFjdXRlO2xpZGEuXCIsXG5cdGRhdGVGQTogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtYSBkYXRhIGNvcnJldGEuXCIsXG5cdGRhdGVJVEE6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bWEgZGF0YSBjb3JyZXRhLlwiLFxuXHRkYXRlTkw6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bWEgZGF0YSBjb3JyZXRhLlwiLFxuXHRleHRlbnNpb246IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bSB2YWxvciBjb20gdW1hIGV4dGVucyZhdGlsZGU7byB2JmFhY3V0ZTtsaWRhLlwiLFxuXHRnaXJvYWNjb3VudE5MOiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW0gbiZ1YWN1dGU7bWVybyBkZSBjb250YSBjb3JyZW50ZSB2JmFhY3V0ZTtsaWRvLlwiLFxuXHRpYmFuOiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW0gYyZvYWN1dGU7ZGlnbyBJQkFOIHYmYWFjdXRlO2xpZG8uXCIsXG5cdGludGVnZXI6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bSBuJnVhY3V0ZTttZXJvIG4mYXRpbGRlO28gZGVjaW1hbC5cIixcblx0aXB2NDogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIElQdjQgdiZhYWN1dGU7bGlkby5cIixcblx0aXB2NjogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIElQdjYgdiZhYWN1dGU7bGlkby5cIixcblx0bGV0dGVyc29ubHk6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSBhcGVuYXMgY29tIGxldHJhcy5cIixcblx0bGV0dGVyc3dpdGhiYXNpY3B1bmM6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSBhcGVuYXMgbGV0cmFzIG91IHBvbnR1YSZjY2VkaWw7w7Vlcy5cIixcblx0bW9iaWxlTkw6IFwiUG9yIGZhdm9yLCBmb3JuZWNlJmNjZWRpbDthIHVtIG4mdWFjdXRlO21lcm8gdiZhYWN1dGU7bGlkbyBkZSB0ZWxlZm9uZS5cIixcblx0bW9iaWxlVUs6IFwiUG9yIGZhdm9yLCBmb3JuZWNlJmNjZWRpbDthIHVtIG4mdWFjdXRlO21lcm8gdiZhYWN1dGU7bGlkbyBkZSB0ZWxlZm9uZS5cIixcblx0bmllRVM6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bSBOSUUgdiZhYWN1dGU7bGlkby5cIixcblx0bmlmRVM6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bSBOSUYgdiZhYWN1dGU7bGlkby5cIixcblx0bm93aGl0ZXNwYWNlOiBcIlBvciBmYXZvciwgbiZhdGlsZGU7byB1dGlsaXplIGVzcGEmY2NlZGlsO29zIGVtIGJyYW5jby5cIixcblx0cGF0dGVybjogXCJPIGZvcm1hdG8gZm9ybmVjaWRvICZlYWN1dGU7IGludiZhYWN1dGU7bGlkby5cIixcblx0cGhvbmVOTDogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIG4mdWFjdXRlO21lcm8gZGUgdGVsZWZvbmUgdiZhYWN1dGU7bGlkby5cIixcblx0cGhvbmVVSzogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIG4mdWFjdXRlO21lcm8gZGUgdGVsZWZvbmUgdiZhYWN1dGU7bGlkby5cIixcblx0cGhvbmVVUzogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIG4mdWFjdXRlO21lcm8gZGUgdGVsZWZvbmUgdiZhYWN1dGU7bGlkby5cIixcblx0cGhvbmVzVUs6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bSBuJnVhY3V0ZTttZXJvIGRlIHRlbGVmb25lIHYmYWFjdXRlO2xpZG8uXCIsXG5cdHBvc3RhbENvZGVDQTogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIG4mdWFjdXRlO21lcm8gZGUgYyZvYWN1dGU7ZGlnbyBwb3N0YWwgdiZhYWN1dGU7bGlkby5cIixcblx0cG9zdGFsY29kZUlUOiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW0gbiZ1YWN1dGU7bWVybyBkZSBjJm9hY3V0ZTtkaWdvIHBvc3RhbCB2JmFhY3V0ZTtsaWRvLlwiLFxuXHRwb3N0YWxjb2RlTkw6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bSBuJnVhY3V0ZTttZXJvIGRlIGMmb2FjdXRlO2RpZ28gcG9zdGFsIHYmYWFjdXRlO2xpZG8uXCIsXG5cdHBvc3Rjb2RlVUs6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bSBuJnVhY3V0ZTttZXJvIGRlIGMmb2FjdXRlO2RpZ28gcG9zdGFsIHYmYWFjdXRlO2xpZG8uXCIsXG5cdHBvc3RhbGNvZGVCUjogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIENFUCB2JmFhY3V0ZTtsaWRvLlwiLFxuXHRyZXF1aXJlX2Zyb21fZ3JvdXA6ICQudmFsaWRhdG9yLmZvcm1hdCggXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHBlbG8gbWVub3MgezB9IGRlc3RlcyBjYW1wb3MuXCIgKSxcblx0c2tpcF9vcl9maWxsX21pbmltdW06ICQudmFsaWRhdG9yLmZvcm1hdCggXCJQb3IgZmF2b3IsIG9wdGFyIGVudHJlIGlnbm9yYXIgZXNzZXMgY2FtcG9zIG91IHByZWVuY2hlciBwZWxvIG1lbm9zIHswfSBkZWxlcy5cIiApLFxuXHRzdGF0ZVVTOiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW0gZXN0YWRvIHYmYWFjdXRlO2xpZG8uXCIsXG5cdHN0cmlwcGVkbWlubGVuZ3RoOiAkLnZhbGlkYXRvci5mb3JtYXQoIFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSBwZWxvIG1lbm9zIHswfSBjYXJhY3RlcmVzLlwiICksXG5cdHRpbWU6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bSBob3ImYWFjdXRlO3JpbyB2JmFhY3V0ZTtsaWRvLCBubyBpbnRlcnZhZG8gZGUgMDA6MDAgYSAyMzo1OS5cIixcblx0dGltZTEyaDogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIGhvciZhYWN1dGU7cmlvIHYmYWFjdXRlO2xpZG8sIG5vIGludGVydmFkbyBkZSAwMTowMCBhIDEyOjU5IGFtL3BtLlwiLFxuXHR1cmwyOiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW1hIFVSTCB2JmFhY3V0ZTtsaWRhLlwiLFxuXHR2aW5VUzogXCJPIG4mdWFjdXRlO21lcm8gZGUgaWRlbnRpZmljYSZjY2VkaWw7JmF0aWxkZTtvIGRlIHZlJmlhY3V0ZTtjdWxvIGluZm9ybWFkbyAoVklOKSAmZWFjdXRlOyBpbnYmYWFjdXRlO2xpZG8uXCIsXG5cdHppcGNvZGVVUzogXCJQb3IgZmF2b3IsIGZvcm5lJmNjZWRpbDthIHVtIGMmb2FjdXRlO2RpZ28gcG9zdGFsIGFtZXJpY2FubyB2JmFhY3V0ZTtsaWRvLlwiLFxuXHR6aXByYW5nZTogXCJPIGMmb2FjdXRlO2RpZ28gcG9zdGFsIGRldmUgZXN0YXIgZW50cmUgOTAyeHgteHh4eCBlIDkwNXh4LXh4eHhcIixcblx0Y3BmQlI6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bSBDUEYgdiZhYWN1dGU7bGlkby5cIixcblx0bmlzQlI6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bSBOSVMvUElTIHYmYWFjdXRlO2xpZG9cIixcblx0Y25oQlI6IFwiUG9yIGZhdm9yLCBmb3JuZSZjY2VkaWw7YSB1bSBDTkggdiZhYWN1dGU7bGlkby5cIixcblx0Y25wakJSOiBcIlBvciBmYXZvciwgZm9ybmUmY2NlZGlsO2EgdW0gQ05QSiB2JmFhY3V0ZTtsaWRvLlwiXG59ICk7XG4iLCIvKiFcbiAqIEphdmFTY3JpcHQgQ29va2llIHYyLjIuMVxuICogaHR0cHM6Ly9naXRodWIuY29tL2pzLWNvb2tpZS9qcy1jb29raWVcbiAqXG4gKiBDb3B5cmlnaHQgMjAwNiwgMjAxNSBLbGF1cyBIYXJ0bCAmIEZhZ25lciBCcmFja1xuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKi9cbjsoZnVuY3Rpb24gKGZhY3RvcnkpIHtcblx0dmFyIHJlZ2lzdGVyZWRJbk1vZHVsZUxvYWRlcjtcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShmYWN0b3J5KTtcblx0XHRyZWdpc3RlcmVkSW5Nb2R1bGVMb2FkZXIgPSB0cnVlO1xuXHR9XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0XHRyZWdpc3RlcmVkSW5Nb2R1bGVMb2FkZXIgPSB0cnVlO1xuXHR9XG5cdGlmICghcmVnaXN0ZXJlZEluTW9kdWxlTG9hZGVyKSB7XG5cdFx0dmFyIE9sZENvb2tpZXMgPSB3aW5kb3cuQ29va2llcztcblx0XHR2YXIgYXBpID0gd2luZG93LkNvb2tpZXMgPSBmYWN0b3J5KCk7XG5cdFx0YXBpLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR3aW5kb3cuQ29va2llcyA9IE9sZENvb2tpZXM7XG5cdFx0XHRyZXR1cm4gYXBpO1xuXHRcdH07XG5cdH1cbn0oZnVuY3Rpb24gKCkge1xuXHRmdW5jdGlvbiBleHRlbmQgKCkge1xuXHRcdHZhciBpID0gMDtcblx0XHR2YXIgcmVzdWx0ID0ge307XG5cdFx0Zm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhdHRyaWJ1dGVzID0gYXJndW1lbnRzWyBpIF07XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gYXR0cmlidXRlcykge1xuXHRcdFx0XHRyZXN1bHRba2V5XSA9IGF0dHJpYnV0ZXNba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAocykge1xuXHRcdHJldHVybiBzLnJlcGxhY2UoLyglWzAtOUEtWl17Mn0pKy9nLCBkZWNvZGVVUklDb21wb25lbnQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5pdCAoY29udmVydGVyKSB7XG5cdFx0ZnVuY3Rpb24gYXBpKCkge31cblxuXHRcdGZ1bmN0aW9uIHNldCAoa2V5LCB2YWx1ZSwgYXR0cmlidXRlcykge1xuXHRcdFx0aWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRhdHRyaWJ1dGVzID0gZXh0ZW5kKHtcblx0XHRcdFx0cGF0aDogJy8nXG5cdFx0XHR9LCBhcGkuZGVmYXVsdHMsIGF0dHJpYnV0ZXMpO1xuXG5cdFx0XHRpZiAodHlwZW9mIGF0dHJpYnV0ZXMuZXhwaXJlcyA9PT0gJ251bWJlcicpIHtcblx0XHRcdFx0YXR0cmlidXRlcy5leHBpcmVzID0gbmV3IERhdGUobmV3IERhdGUoKSAqIDEgKyBhdHRyaWJ1dGVzLmV4cGlyZXMgKiA4NjRlKzUpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBXZSdyZSB1c2luZyBcImV4cGlyZXNcIiBiZWNhdXNlIFwibWF4LWFnZVwiIGlzIG5vdCBzdXBwb3J0ZWQgYnkgSUVcblx0XHRcdGF0dHJpYnV0ZXMuZXhwaXJlcyA9IGF0dHJpYnV0ZXMuZXhwaXJlcyA/IGF0dHJpYnV0ZXMuZXhwaXJlcy50b1VUQ1N0cmluZygpIDogJyc7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdHZhciByZXN1bHQgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG5cdFx0XHRcdGlmICgvXltcXHtcXFtdLy50ZXN0KHJlc3VsdCkpIHtcblx0XHRcdFx0XHR2YWx1ZSA9IHJlc3VsdDtcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaCAoZSkge31cblxuXHRcdFx0dmFsdWUgPSBjb252ZXJ0ZXIud3JpdGUgP1xuXHRcdFx0XHRjb252ZXJ0ZXIud3JpdGUodmFsdWUsIGtleSkgOlxuXHRcdFx0XHRlbmNvZGVVUklDb21wb25lbnQoU3RyaW5nKHZhbHVlKSlcblx0XHRcdFx0XHQucmVwbGFjZSgvJSgyM3wyNHwyNnwyQnwzQXwzQ3wzRXwzRHwyRnwzRnw0MHw1Qnw1RHw1RXw2MHw3Qnw3RHw3QykvZywgZGVjb2RlVVJJQ29tcG9uZW50KTtcblxuXHRcdFx0a2V5ID0gZW5jb2RlVVJJQ29tcG9uZW50KFN0cmluZyhrZXkpKVxuXHRcdFx0XHQucmVwbGFjZSgvJSgyM3wyNHwyNnwyQnw1RXw2MHw3QykvZywgZGVjb2RlVVJJQ29tcG9uZW50KVxuXHRcdFx0XHQucmVwbGFjZSgvW1xcKFxcKV0vZywgZXNjYXBlKTtcblxuXHRcdFx0dmFyIHN0cmluZ2lmaWVkQXR0cmlidXRlcyA9ICcnO1xuXHRcdFx0Zm9yICh2YXIgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG5cdFx0XHRcdGlmICghYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHN0cmluZ2lmaWVkQXR0cmlidXRlcyArPSAnOyAnICsgYXR0cmlidXRlTmFtZTtcblx0XHRcdFx0aWYgKGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPT09IHRydWUpIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIENvbnNpZGVycyBSRkMgNjI2NSBzZWN0aW9uIDUuMjpcblx0XHRcdFx0Ly8gLi4uXG5cdFx0XHRcdC8vIDMuICBJZiB0aGUgcmVtYWluaW5nIHVucGFyc2VkLWF0dHJpYnV0ZXMgY29udGFpbnMgYSAleDNCIChcIjtcIilcblx0XHRcdFx0Ly8gICAgIGNoYXJhY3Rlcjpcblx0XHRcdFx0Ly8gQ29uc3VtZSB0aGUgY2hhcmFjdGVycyBvZiB0aGUgdW5wYXJzZWQtYXR0cmlidXRlcyB1cCB0byxcblx0XHRcdFx0Ly8gbm90IGluY2x1ZGluZywgdGhlIGZpcnN0ICV4M0IgKFwiO1wiKSBjaGFyYWN0ZXIuXG5cdFx0XHRcdC8vIC4uLlxuXHRcdFx0XHRzdHJpbmdpZmllZEF0dHJpYnV0ZXMgKz0gJz0nICsgYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXS5zcGxpdCgnOycpWzBdO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gKGRvY3VtZW50LmNvb2tpZSA9IGtleSArICc9JyArIHZhbHVlICsgc3RyaW5naWZpZWRBdHRyaWJ1dGVzKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBnZXQgKGtleSwganNvbikge1xuXHRcdFx0aWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgamFyID0ge307XG5cdFx0XHQvLyBUbyBwcmV2ZW50IHRoZSBmb3IgbG9vcCBpbiB0aGUgZmlyc3QgcGxhY2UgYXNzaWduIGFuIGVtcHR5IGFycmF5XG5cdFx0XHQvLyBpbiBjYXNlIHRoZXJlIGFyZSBubyBjb29raWVzIGF0IGFsbC5cblx0XHRcdHZhciBjb29raWVzID0gZG9jdW1lbnQuY29va2llID8gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7ICcpIDogW107XG5cdFx0XHR2YXIgaSA9IDA7XG5cblx0XHRcdGZvciAoOyBpIDwgY29va2llcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIgcGFydHMgPSBjb29raWVzW2ldLnNwbGl0KCc9Jyk7XG5cdFx0XHRcdHZhciBjb29raWUgPSBwYXJ0cy5zbGljZSgxKS5qb2luKCc9Jyk7XG5cblx0XHRcdFx0aWYgKCFqc29uICYmIGNvb2tpZS5jaGFyQXQoMCkgPT09ICdcIicpIHtcblx0XHRcdFx0XHRjb29raWUgPSBjb29raWUuc2xpY2UoMSwgLTEpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR2YXIgbmFtZSA9IGRlY29kZShwYXJ0c1swXSk7XG5cdFx0XHRcdFx0Y29va2llID0gKGNvbnZlcnRlci5yZWFkIHx8IGNvbnZlcnRlcikoY29va2llLCBuYW1lKSB8fFxuXHRcdFx0XHRcdFx0ZGVjb2RlKGNvb2tpZSk7XG5cblx0XHRcdFx0XHRpZiAoanNvbikge1xuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0Y29va2llID0gSlNPTi5wYXJzZShjb29raWUpO1xuXHRcdFx0XHRcdFx0fSBjYXRjaCAoZSkge31cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRqYXJbbmFtZV0gPSBjb29raWU7XG5cblx0XHRcdFx0XHRpZiAoa2V5ID09PSBuYW1lKSB7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHt9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBrZXkgPyBqYXJba2V5XSA6IGphcjtcblx0XHR9XG5cblx0XHRhcGkuc2V0ID0gc2V0O1xuXHRcdGFwaS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRyZXR1cm4gZ2V0KGtleSwgZmFsc2UgLyogcmVhZCBhcyByYXcgKi8pO1xuXHRcdH07XG5cdFx0YXBpLmdldEpTT04gPSBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRyZXR1cm4gZ2V0KGtleSwgdHJ1ZSAvKiByZWFkIGFzIGpzb24gKi8pO1xuXHRcdH07XG5cdFx0YXBpLnJlbW92ZSA9IGZ1bmN0aW9uIChrZXksIGF0dHJpYnV0ZXMpIHtcblx0XHRcdHNldChrZXksICcnLCBleHRlbmQoYXR0cmlidXRlcywge1xuXHRcdFx0XHRleHBpcmVzOiAtMVxuXHRcdFx0fSkpO1xuXHRcdH07XG5cblx0XHRhcGkuZGVmYXVsdHMgPSB7fTtcblxuXHRcdGFwaS53aXRoQ29udmVydGVyID0gaW5pdDtcblxuXHRcdHJldHVybiBhcGk7XG5cdH1cblxuXHRyZXR1cm4gaW5pdChmdW5jdGlvbiAoKSB7fSk7XG59KSk7XG4iLCJBUFAuY29tcG9uZW50LlNlYXJjaFJlc3VsdCA9IFZ0ZXhDbGFzcy5leHRlbmQoe1xyXG4gIGluaXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICB0aGlzLnNldHVwKG9wdGlvbnMpXHJcbiAgfSxcclxuXHJcbiAgc2V0dXA6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICR0b3RhbFNlYXJjaFJlc3VsdDogJCgnLnJlc3VsdGFkby1idXNjYS1udW1lcm86Zmlyc3QgLnZhbHVlJyksXHJcbiAgICAgICR0ZXJtc1NlYXJjaFJlc3VsdDogJCgnLnJlc3VsdGFkby1idXNjYS10ZXJtbzpmaXJzdCAudmFsdWUnKSxcclxuICAgIH0sIG9wdGlvbnMpXHJcbiAgfSxcclxuXHJcbiAgZ2V0VG90YWxTZWFyY2hSZXN1bHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuJHRvdGFsU2VhcmNoUmVzdWx0LnRleHQoKVxyXG4gIH0sXHJcblxyXG4gIGdldFRlcm1zU2VhcmNoUmVzdWx0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLiR0ZXJtc1NlYXJjaFJlc3VsdC50ZXh0KClcclxuICB9XHJcbn0pXHJcbiIsIkFQUC5jb250cm9sbGVyLkFib3V0ID0gVnRleENsYXNzLmV4dGVuZCh7XHJcbiAgaW5pdDogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBzZWxmLnNldHVwKCk7XHJcbiAgICBzZWxmLnN0YXJ0KCk7XHJcbiAgICBzZWxmLmJpbmQoKTtcclxuICB9LFxyXG5cclxuICBzZXR1cDogZnVuY3Rpb24oKSB7XHJcblxyXG4gIH0sXHJcblxyXG4gc3RhcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gc2hlbGZcclxuICAgICQoJy5hbWlzc2ltYS0tc2hlbGYgdWwnKS5zbGljayh7XHJcbiAgICAgIGFycm93czogdHJ1ZSxcclxuICAgICAgaW5maW5pdGU6IGZhbHNlLFxyXG4gICAgICBzbGlkZXNUb1Nob3c6IDQsXHJcbiAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxLFxyXG4gICAgICAgIHJlc3BvbnNpdmU6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBicmVha3BvaW50OiA5OTk5LFxyXG4gICAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogNCxcclxuICAgICAgICAgICAgICBzbGlkZXNUb1Njcm9sbDogMSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICBicmVha3BvaW50OiAxMDI0LFxyXG4gICAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogMixcclxuICAgICAgICAgICAgICBzbGlkZXNUb1Njcm9sbDogMSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICBiaW5kOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgfVxyXG59KTtcclxuIiwiQVBQLmNvbnRyb2xsZXIuQWNjb3VudCA9IFZ0ZXhDbGFzcy5leHRlbmQoe1xyXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgc2VsZi5zZXR1cCgpXHJcbiAgICBzZWxmLnN0YXJ0KClcclxuICAgIHNlbGYuYmluZCgpXHJcbiAgfSxcclxuXHJcbiAgc2V0dXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5vcHRpb25zID0ge1xyXG5cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBzdGFydDogZnVuY3Rpb24oKSB7XHJcblxyXG4gIH0sXHJcblxyXG5cclxuICBiaW5kOiBmdW5jdGlvbigpIHtcclxuICB9XHJcbn0pXHJcbiIsIkFQUC5jb21wb25lbnQuQ2FydE1pbmkgPSBWdGV4Q2xhc3MuZXh0ZW5kKHtcclxuICAvLyBpbml0XHJcbiAgaW5pdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIHRoaXMuY291bnQgPSAwO1xyXG4gICAgdGhpcy5lbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50ID8gb3B0aW9ucy5lbGVtZW50IDogJCgnLmhlYWRlci1hbWlzc2ltYS0tY2FydC0tY29udGVudCcpO1xyXG5cclxuICAgIHZ0ZXhqcy5jaGVja291dC5nZXRPcmRlckZvcm0oKVxyXG4gICAgICAuZG9uZShvcmRlckZvcm0gPT4ge1xyXG4gICAgICAgIHRoaXMubG9hZENhcnQob3JkZXJGb3JtKTtcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAkKHdpbmRvdykub24oJ29yZGVyRm9ybVVwZGF0ZWQudnRleCcsIChldnQsIG9yZGVyRm9ybSkgPT4ge1xyXG4gICAgICB0aGlzLmNvdW50ID0gb3JkZXJGb3JtLml0ZW1zLmxlbmd0aDtcclxuICAgICAgdGhpcy5sb2FkQ2FydChvcmRlckZvcm0pO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLy8gYWRkIHByb2R1Y3RcclxuICBhZGRQcm9kdWN0OiBmdW5jdGlvbiAocHJvZHVjdCwgcGFyZW50KSB7XHJcbiAgICBpZiAocGFyZW50IGluc3RhbmNlb2YgT2JqZWN0ICYmIHByb2R1Y3QgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgY29uc3QgaXRlbSA9ICQoJzxsaSBjbGFzcz1cImhlYWRlci1hbWlzc2ltYS0tY2FydC0taXRlbVwiIC8+Jyk7XHJcbiAgICAgIGNvbnN0IGxpbmsgPSAkKGA8YSBjbGFzcz1cImxpbmtcIiBocmVmPVwiJHtwcm9kdWN0LmRldGFpbFVybH1cIiAvPmApO1xyXG5cclxuICAgICAgaWYgKGxpbmspIHtcclxuICAgICAgICBjb25zdCBpbWFnZSA9ICQoYDxkaXYgY2xhc3M9XCJpbWFnZVwiPlxyXG4gICAgICAgIDxpbWcgc3JjPVwiJHtwcm9kdWN0LmltYWdlVXJsfVwiIGFsdD1cIiR7cHJvZHVjdC5uYW1lfVwiIC8+PC9kaXY+YCk7XHJcblxyXG4gICAgICAgIGxldCBpbmZvO1xyXG5cclxuXHJcbiAgICAgICAgaWYocHJvZHVjdC5zZWxsaW5nUHJpY2UgIT09IHByb2R1Y3QucHJpY2UgJiYgcHJvZHVjdC5zZWxsaW5nUHJpY2UgIT09IDApe1xyXG4gICAgICAgICAgaW5mbyA9ICQoYDxkaXYgY2xhc3M9XCJpbmZvXCI+XHJcbiAgICAgICAgICAgIDxwIGNsYXNzPVwibmFtZVwiPiR7cHJvZHVjdC5uYW1lfTwvcD5cclxuICAgICAgICAgICAgPHAgY2xhc3M9XCJwcmljZVwiPlxyXG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicHJpY2Utbm9ybWFsXCI+UiQgJHt0aGlzLm1vbmV5Q29udmVydChwcm9kdWN0LnByaWNlLnRvU3RyaW5nKCkpfTwvc3Bhbj5cclxuICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInByaWNlLXNlbGxpbmdcIj5SJCAke3RoaXMubW9uZXlDb252ZXJ0KHByb2R1Y3Quc2VsbGluZ1ByaWNlLnRvU3RyaW5nKCkpfTwvc3Bhbj5cclxuICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPC9kaXY+YCk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICBpbmZvID0gJChgPGRpdiBjbGFzcz1cImluZm9cIj5cclxuICAgICAgICAgICAgPHAgY2xhc3M9XCJuYW1lXCI+JHtwcm9kdWN0Lm5hbWV9PC9wPlxyXG4gICAgICAgICAgICA8cCBjbGFzcz1cInByaWNlXCI+XHJcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJwcmljZS1zZWxsaW5nXCI+UiQgJHt0aGlzLm1vbmV5Q29udmVydChwcm9kdWN0LnByaWNlLnRvU3RyaW5nKCkpfTwvc3Bhbj5cclxuICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPC9kaXY+YCk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcblxyXG4gICAgICAgIGxpbmsuYXBwZW5kKGltYWdlKTtcclxuICAgICAgICBsaW5rLmFwcGVuZChpbmZvKTtcclxuICAgICAgICBpdGVtLmFwcGVuZChsaW5rKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcGFyZW50LmFwcGVuZChpdGVtKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBsb2FkIGNhcnRcclxuICBsb2FkQ2FydDogZnVuY3Rpb24gKG9yZGVyRm9ybSkge1xyXG4gICAgaWYgKG9yZGVyRm9ybSBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICBjb25zdCBsaXN0ID0gdGhpcy5lbGVtZW50LnBhcmVudCgpLmZpbmQoJy5oZWFkZXItYW1pc3NpbWEtLWNhcnQtLWxpc3QnKTtcclxuICAgICAgY29uc3QgbnVtYmVyID0gdGhpcy5lbGVtZW50LnBhcmVudCgpLmZpbmQoJy5oZWFkZXItYW1pc3NpbWEtLWNhcnQtLW9wZW4gPiAubnVtYmVyJyk7XHJcbiAgICAgIGNvbnN0IG51bWJlck1vYmlsZSA9IHRoaXMuZWxlbWVudC5wYXJlbnQoKS5maW5kKCcuaGVhZGVyLWFtaXNzaW1hLS1tb2JpbGUtY29udHJvbHMtLWJhZyAubnVtYmVyJyk7XHJcbiAgICAgIGNvbnNvbGUubG9nKG9yZGVyRm9ybSlcclxuICAgICAgaWYgKG9yZGVyRm9ybS5pdGVtcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgbGlzdC5lbXB0eSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnNvbGUubG9nKG51bWJlciwgbnVtYmVyTW9iaWxlLCBwYXJzZUludChvcmRlckZvcm0uaXRlbXMubGVuZ3RoKSlcclxuICAgICAgICBudW1iZXIudGV4dChwYXJzZUludChvcmRlckZvcm0uaXRlbXMubGVuZ3RoKSk7XHJcbiAgICAgICAgbnVtYmVyTW9iaWxlLnRleHQocGFyc2VJbnQob3JkZXJGb3JtLml0ZW1zLmxlbmd0aCkpO1xyXG5cclxuICAgICAgICBpZiAobGlzdCBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgdGhpcy50b3RhbChvcmRlckZvcm0udG90YWxpemVycyk7XHJcbiAgICAgICAgICBvcmRlckZvcm0uaXRlbXMubWFwKGl0ZW0gPT4gdGhpcy5hZGRQcm9kdWN0KGl0ZW0sIGxpc3QpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBudW1iZXIudGV4dCgnJyk7XHJcbiAgICAgIG51bWJlck1vYmlsZS50ZXh0KCcnKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBtb25leSBjb252ZXJ0XHJcbiAgbW9uZXlDb252ZXJ0OiBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgIGNvbnN0IHZhbCA9IHZhbHVlLnRvU3RyaW5nKCkuc3BsaXQoJycpO1xyXG4gICAgbGV0IG51bSA9IHZhbC5zcGxpY2UoLTIpO1xyXG4gICAgbnVtID0gdmFsLmpvaW4oJycpICsgJy4nICsgbnVtLmpvaW4oJycpO1xyXG5cclxuICAgIHJldHVybiBudW0ucmVwbGFjZSgvWy5dL2csIFwiLFwiKS5yZXBsYWNlKC9cXGQoPz0oPzpcXGR7M30pKyg/OlxcRHwkKSkvZywgXCIkJi5cIik7XHJcbiAgfSxcclxuXHJcbiAgLy8gb3BlbiBjYXJ0XHJcbiAgb3BlbkNsb3NlQ2FydDogZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICBpZiAodGhpcy5lbGVtZW50IGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgIHRoaXMuZWxlbWVudC5hdHRyKCdkYXRhLWFjdGl2ZScsIHZhbHVlKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyB0b2dnbGVcclxuICB0b2dnbGU6IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLmVsZW1lbnQgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgY29uc3QgdG9nZ2xlID0gdGhpcy5lbGVtZW50LmF0dHIoJ2RhdGEtYWN0aXZlJyk7XHJcblxyXG4gICAgICBpZiAoJCh3aW5kb3cpLndpZHRoKCkgPD0gMTAyNCkge1xyXG4gICAgICAgIGNvbnN0IHBhcmVudCA9ICQoJy5oZWFkZXItYW1pc3NpbWEnKS5hdHRyKCdkYXRhLXR5cGUnKTtcclxuXHJcbiAgICAgICAgaWYgKHBhcmVudCAhPT0gJ3NlYXJjaCcpIHtcclxuICAgICAgICAgIHBhcmVudC5hdHRyKCdkYXRhLXR5cGUnLCAnc2VhcmNoJyk7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhcmVudC5hdHRyKCdkYXRhLXR5cGUnLCAnJyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmF0dHIoJ2RhdGEtYWN0aXZlJywgdG9nZ2xlID09PSAndHJ1ZScgPyBmYWxzZSA6IHRydWUpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIHRvdGFsXHJcbiAgdG90YWw6IGZ1bmN0aW9uICh0b3RhbGl6ZXJzKSB7XHJcbiAgICBpZiAodG90YWxpemVycyBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICBjb25zdCB0b3RhbCA9IHRoaXMuZWxlbWVudC5maW5kKCcuaGVhZGVyLWFtaXNzaW1hLS1jYXJ0LS1jb250cm9scyA+IC50b3RhbCAucHJpY2UnKTtcclxuXHJcbiAgICAgIGlmICh0b3RhbCBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgIHRvdGFsLnRleHQoYFIkICR7dGhpcy5tb25leUNvbnZlcnQodG90YWxpemVyc1swXS52YWx1ZS50b1N0cmluZygpKX1gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIkFQUC5jb250cm9sbGVyLkNhdGFsb2cgPSBWdGV4Q2xhc3MuZXh0ZW5kKHtcclxuICAvLyBpbml0XHJcbiAgaW5pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zZXR1cCgpXHJcbiAgICB0aGlzLnN0YXJ0KClcclxuICAgIHRoaXMuYmluZCgpXHJcbiAgfSxcclxuXHJcbiAgLy8gYmluZFxyXG4gIGJpbmQ6IGZ1bmN0aW9uICgpIHt9LFxyXG5cclxuICAvLyBudW1iZXIgY291bnRcclxuICBudW1iZXJDb3VudDogZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5lbGVtZW50LmZpbmQoJy5hbWlzc2ltYS1jYXRhbG9nLS1icmVhZGNydW1iJylcclxuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5lbGVtZW50LmZpbmQoJy5zZWFyY2hSZXN1bHRzVGltZTpmaXJzdC1jaGlsZCAucmVzdWx0YWRvLWJ1c2NhLW51bWVybyAudmFsdWUnKVxyXG5cclxuICAgIGlmIChjb3VudCkge1xyXG4gICAgICBjb25zdCBlbGVtZW50ID0gYDxwIGNsYXNzPVwiY291bnRcIj4ke2NvdW50LnRleHQoKX0gaXRlbnM8L3A+YDtcclxuICAgICAgcGFyZW50LmFwcGVuZChlbGVtZW50KTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBmaWx0ZXJzXHJcbiAgZmlsdGVyczogZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgZmlsdGVycyA9IHRoaXMuZWxlbWVudC5maW5kKCcuYW1pc3NpbWEtY2F0YWxvZy0tZmlsdGVycycpO1xyXG5cclxuICAgIGlmIChmaWx0ZXJzLmxlbmd0aCA+IDApIHtcclxuICAgICAgY29uc3QgaXRlbXMgPSBmaWx0ZXJzLmZpbmQoJy5zZWFyY2gtbXVsdGlwbGUtbmF2aWdhdG9yIGZpZWxkc2V0LnJlZmlubycpO1xyXG5cclxuICAgICAgJC5lYWNoKGl0ZW1zLCAoaW5kZXgsIGVsZW1lbnQpID0+IHtcclxuICAgICAgICBjb25zdCBpdGVtID0gJChlbGVtZW50KTtcclxuICAgICAgICBjb25zdCBidG4gPSBpdGVtLmZpbmQoJ2g1JylcclxuICAgICAgICBjb25zdCBjbGFzc05hbWUgPSBidG4udGV4dCgpLnJlcGxhY2UoL1teYS16QS1aIF0vZywgXCJcIilcclxuXHJcbiAgICAgICAgaWYgKGJ0bi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICB0aGlzLmZpbHRlckFjdGl2ZShidG4sIGl0ZW1zKVxyXG4gICAgICAgICAgdGhpcy5maWx0ZXJUeXBlKGl0ZW0sIGNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICB0aGlzLmZpbHRlck1vYmlsZShmaWx0ZXJzKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIGZpbHRlciBhZGQgdGV4dFxyXG4gIGZpbHRlckFkZFRleHQ6IGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICBpZiAoaXRlbSBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICBjb25zdCBjb250YWluZXIgPSAkKCc8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+PC9kaXY+JylcclxuXHJcbiAgICAgIGNvbnRhaW5lci5hcHBlbmQoYDxwIGNsYXNzPVwidGl0bGVcIj4ke2l0ZW0uZmluZCgnaDUnKS50ZXh0KCl9PC9wPmApXHJcbiAgICAgIGNvbnRhaW5lci5hcHBlbmQoaXRlbS5maW5kKCdkaXYnKSlcclxuXHJcbiAgICAgIGl0ZW0uYXBwZW5kKGNvbnRhaW5lcilcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBmaWx0ZXIgYWN0aXZlIFwiYnV0dG9uXCJcclxuICBmaWx0ZXJBY3RpdmU6IGZ1bmN0aW9uIChidG4sIGl0ZW1zKSB7XHJcbiAgICBpZiAoYnRuIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgIGJ0bi5vbignY2xpY2snLCBldmVudCA9PiB7XHJcbiAgICAgICAgY29uc3QgcGFyZW50ID0gJChldmVudC50YXJnZXQpLnBhcmVudCgpO1xyXG5cclxuICAgICAgICBpZiAocGFyZW50Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICQuZWFjaChpdGVtcywgKGluZGV4LCBpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSAkKGl0ZW0pXHJcblxyXG4gICAgICAgICAgICBpZiAocGFyZW50WzBdICE9PSBpdGVtKSB7XHJcbiAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVDbGFzcygnYWN0aXZlJylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgcGFyZW50LnRvZ2dsZUNsYXNzKCdhY3RpdmUnKVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gZmlsdGVyIGNsZWFyXHJcbiAgZmlsdGVyQ2xlYXJUZXh0OiBmdW5jdGlvbiAoZWxlbWVudCwgdHlwZSwgY2xhc3NOYW1lKSB7XHJcbiAgICBjb25zdCBpdGVtID0gJChlbGVtZW50KVxyXG5cclxuICAgIGlmIChpdGVtKSB7XHJcbiAgICAgIGNvbnN0IGlucHV0ID0gaXRlbS5maW5kKCdpbnB1dCcpXHJcbiAgICAgIGNvbnN0IHRleHQgPSB0eXBlID09PSB0cnVlID8gaXRlbS50ZXh0KCkucmVwbGFjZSgvKFxccykoXFwoKShbMC05XSopKFxcKSkvZ2ksICcnKSA6IGl0ZW0udGV4dCgpXHJcbiAgICAgIGNvbnN0IHRleHRFbGVtZW50ID0gJChgPHNwYW4gY2xhc3M9XCJ0ZXh0XCI+JHt0ZXh0fTwvc3Bhbj5gKVxyXG5cclxuICAgICAgaXRlbS5lbXB0eSgpXHJcbiAgICAgIGl0ZW0uYXBwZW5kKGlucHV0KVxyXG4gICAgICBpdGVtLmFwcGVuZCh0ZXh0RWxlbWVudClcclxuXHJcbiAgICAgIGlmIChjbGFzc05hbWUgPT09ICdjb3InKSB7XHJcbiAgICAgICAgY29uc3QgY29sb3IgPSB0ZXh0LnJlcGxhY2UoL1xccysvZywgJy0nKS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgaXRlbS5wcmVwZW5kKGA8aW1nIGNsYXNzPVwiYWN0aXZlXCIgc3JjPVwiL2FycXVpdm9zL2NvbG9yLSR7Y29sb3J9LnBuZ1wiIG9uRXJyb3I9XCJ0aGlzLmNsYXNzTmFtZT0nJ1wiIGFsdD1cIiR7Y29sb3J9XCIgLz5gKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gZmlsdGVyIG1vYmlsZVxyXG4gIGZpbHRlck1vYmlsZTogZnVuY3Rpb24gKGVsZW1lbnQpIHtcclxuICAgIGlmIChlbGVtZW50Lmxlbmd0aCA+IDApIHtcclxuICAgICAgY29uc3QgYnV0dG9uTW9iaWxlID0gJChgPGJ1dHRvbiBjbGFzcz1cImJ0bi1maWx0ZXItb3BlblwiPlxyXG4gICAgICAgIGZpbHRyYXI8c3BhbiBjbGFzcz1cImljb24gaWNvbi1maWx0ZXJcIj48L3NwYW4+XHJcbiAgICAgIDwvYnV0dG9uPmApXHJcblxyXG4gICAgICBidXR0b25Nb2JpbGUub24oJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgIGJ1dHRvbk1vYmlsZS5wYXJlbnQoKS50b2dnbGVDbGFzcyhlID0+IHtcclxuICAgICAgICAgIGlmIChlID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyTW9iaWxlQWN0aXZlKCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuICdhY3RpdmUnXHJcbiAgICAgICAgfSlcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBlbGVtZW50LmFwcGVuZChidXR0b25Nb2JpbGUpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gZmlsdGVyIG1vYmlsZSBhY3RpdmVcclxuICBmaWx0ZXJNb2JpbGVBY3RpdmU6IGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IHBhcmVudCA9ICQoJy5yZWZpbm8uY29yJylcclxuXHJcbiAgICBpZiAocGFyZW50LmZpbmQoJy5jb250YWluZXIgLmJ0bi1tb3JlJykubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIGNvbnN0IGJ0bk1vcmUgPSAkKGA8YnV0dG9uIGNsYXNzPVwiYnRuLW1vcmVcIj5cclxuICAgICAgICA8c3BhbiBjbGFzcz1cInRleHRcIj5WZXIgbWFpczwvc3Bhbj5cclxuICAgICAgICA8c3BhbiBjbGFzcz1cInRleHRcIj5WZXIgbWVub3M8L3NwYW4+XHJcbiAgICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tYXJyb3ctZG93blwiPjwvc3Bhbj5cclxuICAgICAgPC9idXR0b24+YClcclxuXHJcbiAgICAgIGJ0bk1vcmUub24oJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgIHBhcmVudC50b2dnbGVDbGFzcygnbW9yZScpXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcGFyZW50LmZpbmQoJy5jb250YWluZXInKS5hcHBlbmQoYnRuTW9yZSlcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gJ2FjdGl2ZSdcclxuICB9LFxyXG5cclxuICAvLyBmaWx0ZXIgdHlwZVxyXG4gIGZpbHRlclR5cGU6IGZ1bmN0aW9uIChpdGVtLCBjbGFzc05hbWUpIHtcclxuICAgIGlmIChpdGVtIGluc3RhbmNlb2YgT2JqZWN0ID09PSB0cnVlKSB7XHJcbiAgICAgIGl0ZW0uYWRkQ2xhc3MoY2xhc3NOYW1lKVxyXG5cclxuICAgICAgc3dpdGNoIChjbGFzc05hbWUpIHtcclxuICAgICAgICBjYXNlICd0ZW5kbmNpYXMnOlxyXG4gICAgICAgICAgJChpdGVtKS5maW5kKCdkaXYgPiBsYWJlbCcpLmVhY2goKGluZGV4LCBpdGVtKSA9PiB0aGlzLmZpbHRlckNsZWFyVGV4dChpdGVtLCBmYWxzZSkpXHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdjb3InOlxyXG4gICAgICAgICAgJChpdGVtKS5maW5kKCdkaXYgPiBsYWJlbCcpLmVhY2goKGluZGV4LCBpdGVtKSA9PiB0aGlzLmZpbHRlckNsZWFyVGV4dChpdGVtLCB0cnVlLCBjbGFzc05hbWUpKVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAndGFtYW5obyc6XHJcbiAgICAgICAgICAkKGl0ZW0pLmZpbmQoJ2RpdiA+IGxhYmVsJykuZWFjaCgoaW5kZXgsIGl0ZW0pID0+IHRoaXMuZmlsdGVyQ2xlYXJUZXh0KGl0ZW0sIHRydWUpKVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5maWx0ZXJBZGRUZXh0KGl0ZW0pXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgZmlsdGVyU3ViQ2F0ZWdvcmllczogZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgcGFyZW50ID0gJCgnLmNhdGFsb2cgLmFtaXNzaW1hLWNhdGFsb2ctLWZpbHRlcnMgLnNlYXJjaC1tdWx0aXBsZS1uYXZpZ2F0b3InKVxyXG4gICAgY29uc3QgbWVudSA9ICQoJy5jYXRhbG9nIC5hbWlzc2ltYS1jYXRhbG9nLS1maWx0ZXJzIC5zZWFyY2gtc2luZ2xlLW5hdmlnYXRvcicpXHJcbiAgICBjb25zdCBidXR0b24gPSAkKCc8aDUgY2xhc3M9XCJldmVuXCI+U3ViIENhdGVnb3JpYXM8L2g1PicpXHJcblxyXG4gICAgY29uc3QgZmlsdGVyID0gJCgnPGZpZWxkc2V0IGNsYXNzPVwicmVmaW5vXCI+PC9maWVsZHNldD4nKVxyXG4gICAgZmlsdGVyLnByZXBlbmQoYnV0dG9uKVxyXG5cclxuICAgIGlmIChtZW51Lmxlbmd0aCAmJiBwYXJlbnQubGVuZ3RoKSB7XHJcbiAgICAgIGZpbHRlci5hcHBlbmQobWVudSlcclxuICAgICAgcGFyZW50LnByZXBlbmQoZmlsdGVyKVxyXG4gICAgICB0aGlzLmZpbHRlclN1YkNhdGVnb3JpZXNSZWZhY3RvcnkobWVudSwgZmlsdGVyKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbWVudS5hZGRDbGFzcygnc2VhcmNoLW11bHRpcGxlLW5hdmlnYXRvcicpXHJcbiAgICAgIG1lbnUucHJlcGVuZChmaWx0ZXIpXHJcbiAgICAgIHRoaXMuZmlsdGVyU3ViQ2F0ZWdvcmllc1JlZmFjdG9yeShtZW51LCBmaWx0ZXIpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgZmlsdGVyU3ViQ2F0ZWdvcmllc1JlZmFjdG9yeTogZnVuY3Rpb24gKGVsZW1lbnQsIHBhcmVudCkge1xyXG4gICAgaWYgKHBhcmVudC5sZW5ndGggPiAwICYmIGVsZW1lbnQubGVuZ3RoID4gMCkge1xyXG4gICAgICBjb25zdCBjb250YWluZXIgPSAkKCc8ZGl2IGNsYXNzPVwiZ3JvdXBzXCI+PC9kaXY+JylcclxuICAgICAgcGFyZW50LmFwcGVuZChjb250YWluZXIpXHJcblxyXG4gICAgICBpZiAoY29udGFpbmVyLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB0aGlzLmZpbHRlclN1YkNhdGVnb3JpZXNSZWZhY3RvcnlHcm91cChlbGVtZW50LCBjb250YWluZXIpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfSxcclxuXHJcbiAgZmlsdGVyU3ViQ2F0ZWdvcmllc1JlZmFjdG9yeUdyb3VwOiBmdW5jdGlvbiAoZWxlbWVudCwgY29udGFpbmVyKSB7XHJcbiAgICBlbGVtZW50LmZpbmQoJy5IaWRlLCAuSGlkZSArIHVsJykucmVtb3ZlKClcclxuXHJcbiAgICBlbGVtZW50LmZpbmQoJ2gzLCBoNCcpLmVhY2goKGluZGV4LCBlbGVtKSA9PiB7XHJcbiAgICAgIGNvbnN0IGl0ZW0gPSAkKGVsZW0pXHJcbiAgICAgIGNvbnN0IGxpc3QgPSBpdGVtLm5leHQoKVxyXG4gICAgICBjb25zdCBncm91cCA9ICQoJzxkaXYgY2xhc3M9XCJncm91cFwiPjwvZGl2PicpXHJcblxyXG4gICAgICBncm91cC5hcHBlbmQoaXRlbSlcclxuICAgICAgLy8gZ3JvdXAuYXBwZW5kKGxpc3QpXHJcblxyXG4gICAgICBpZiAoY29udGFpbmVyLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGNvbnRhaW5lci5hcHBlbmQoZ3JvdXApLCAxMDAwKVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvLyBtb2JpbGUgY2hlY2sgZmlsdGVyXHJcbiAgbW9iaWxlQ2hlY2tGaWx0ZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICgkKHdpbmRvdykud2lkdGgoKSA8PSAxMDI0KSB7XHJcbiAgICAgICQoJy5hbWlzc2ltYS1jYXRhbG9nLS1maWx0ZXJzJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gaGlkZSByZXN1bHRcclxuICBfaGlkZVJlc3VsdDogZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5yZXN1bHRJdGVtc1xyXG4gICAgICAuZmluZCgnLmFtaXNzaW1hLS1zaGVsZiA+IHVsJylcclxuICAgICAgLnN0b3AodHJ1ZSwgdHJ1ZSlcclxuICAgICAgLnNsaWRlVXAoJ3Nsb3cnKVxyXG4gIH0sXHJcblxyXG4gIC8vIHNob3cgcmVzdWx0XHJcbiAgX3Nob3dSZXN1bHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMucmVzdWx0SXRlbXNcclxuICAgICAgLmZpbmQoJy5hbWlzc2ltYS0tc2hlbGYgPiB1bCcpXHJcbiAgICAgIC5zdG9wKHRydWUsIHRydWUpXHJcbiAgICAgIC5zbGlkZURvd24oJ3Nsb3cnKVxyXG4gIH0sXHJcblxyXG4gIC8vIHNjcm9sbCB0b3BcclxuICBfc2Nyb2xsVG9Ub3BSZXN1bHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICQoJ2h0bWwsIGJvZHknKVxyXG4gICAgICAuc3RvcCgpXHJcbiAgICAgIC5hbmltYXRlKHtcclxuICAgICAgICBzY3JvbGxUb3A6IDBcclxuICAgICAgfSwgNTAwKTtcclxuICB9LFxyXG5cclxuICAvLyBzZWFyY2hcclxuICBzZWFyY2g6IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMucmVzdWx0SXRlbXNcclxuICAgICAgLnZ0ZXhTZWFyY2goe1xyXG4gICAgICAgICRzZWxlY3RPcmRlcjogdGhpcy5vcmRlcixcclxuICAgICAgICBwYWdpbmF0aW9uOiB0cnVlXHJcbiAgICAgIH0pXHJcbiAgICAgIC5vbigndnRleHNlYXJjaC5iZWZvcmVGaWx0ZXIgdnRleHNlYXJjaC5iZWZvcmVDaGFuZ2VPcmRlciB2dGV4c2VhcmNoLmJlZm9yZUNoYW5nZVBhZ2UnLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5faGlkZVJlc3VsdCgpXHJcbiAgICAgICAgdGhpcy5fc2Nyb2xsVG9Ub3BSZXN1bHQoKVxyXG4gICAgICB9KVxyXG4gICAgICAub24oJ3Z0ZXhzZWFyY2guYWZ0ZXJGaWx0ZXIgdnRleHNlYXJjaC5hZnRlckNoYW5nZU9yZGVyIHZ0ZXhzZWFyY2guYWZ0ZXJDaGFuZ2VQYWdlJywgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuX3Nob3dSZXN1bHQoKVxyXG4gICAgICB9KVxyXG4gICAgICAub24oJ3Z0ZXhzZWFyY2guYWZ0ZXJTZWFyY2gnLCAoKSA9PiB7fSlcclxuICB9LFxyXG5cclxuICAvLyBzZXR1cFxyXG4gIHNldHVwOiBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmVsZW1lbnQgPSAkKCcuY2F0YWxvZycpXHJcbiAgICB0aGlzLnJlc3VsdEl0ZW1zID0gJCgnLnJlc3VsdEl0ZW1zV3JhcHBlciBkaXZbaWRePVwiUmVzdWx0SXRlbXNcIl0nKVxyXG4gICAgdGhpcy5vcmRlciA9ICQoJy5zZWFyY2gtb3JkZXInKVxyXG5cclxuICAgIG5ldyBBUFAuY29tcG9uZW50LlNlbGVjdCh7XHJcbiAgICAgIHNlbGVjdG9yOiAnLmFtaXNzaW1hLXNlbGVjdCcsXHJcbiAgICAgIGNhbGxiYWNrOiB0aGlzLm1vYmlsZUNoZWNrRmlsdGVyLmJpbmQodGhpcylcclxuICAgIH0pXHJcbiAgfSxcclxuXHJcbiAgLy8gc3RhcnRcclxuICBzdGFydDogZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5udW1iZXJDb3VudCgpXHJcbiAgICB0aGlzLmZpbHRlclN1YkNhdGVnb3JpZXMoKVxyXG4gICAgdGhpcy5maWx0ZXJzKClcclxuICAgIHRoaXMuc2VhcmNoKClcclxuXHJcbiAgICBuZXcgQVBQLmNvbXBvbmVudC5TZWFyY2goe30pO1xyXG4gICAgbmV3IEFQUC5jb21wb25lbnQuU2hlbGYoJCgnLmFtaXNzaW1hLS1zaGVsZicpWzBdKVxyXG4gIH0sXHJcbn0pIiwiQVBQLmNvbnRyb2xsZXIuQ29sbGVjdGlvbiA9IFZ0ZXhDbGFzcy5leHRlbmQoe1xyXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgc2VsZi5zZXR1cCgpO1xyXG4gICAgc2VsZi5zdGFydCgpO1xyXG4gICAgc2VsZi5iaW5kKCk7XHJcbiAgfSxcclxuXHJcbiAgc2V0dXA6IGZ1bmN0aW9uKCkge1xyXG5cclxuICB9LFxyXG5cclxuICBzdGFydDogZnVuY3Rpb24oKSB7XHJcbiAgICBuZXcgQVBQLmNvbXBvbmVudC5TaGVsZigkKCcuYW1pc3NpbWEtLXNoZWxmJylbMF0pXHJcbiAgICB0aGlzLmNsb25lUGFnZXMoKVxyXG4gIH0sXHJcblxyXG4gIGJpbmQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICB9LFxyXG4gIGNsb25lUGFnZXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKCQoJy5wYWdlci5ib3R0b20nKS5pcygnOmVtcHR5JykpIHtcclxuICAgICAgJCgnLnBhZ2VyLmJvdHRvbSAucGFnZXMnKS5jbG9uZSgpLmFwcGVuZFRvKCcucGFnZXIuYm90dG9tJyk7XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuIiwiQVBQLmNvbnRyb2xsZXIuR2VuZXJhbCA9IFZ0ZXhDbGFzcy5leHRlbmQoe1xyXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgc2VsZi5zZXR1cCgpXHJcbiAgICBzZWxmLnN0YXJ0KClcclxuICAgIHNlbGYuYmluZCgpXHJcbiAgfSxcclxuXHJcbiAgc2V0dXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5yZW1vdmVIZWxwZXJDb21wbGVtZW50KCk7XHJcbiAgfSxcclxuXHJcbiAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgaGVhZGVyID0gbmV3IEFQUC5jb21wb25lbnQuSGVhZGVyKHsgc2VsZWN0b3I6ICcuaGVhZGVyLWFtaXNzaW1hJyB9KTtcclxuICAgIGNvbnN0IHNlYXJjaCA9IG5ldyBBUFAuY29tcG9uZW50LlNlYXJjaCh7fSk7XHJcbiAgICAvLyBjb25zdCBzaGVsZiA9IG5ldyBBUFAuY29tcG9uZW50LlNoZWxmKCk7XHJcbiAgICB0aGlzLl9pc0xvZ2dlZEluKCk7XHJcbiAgICB0aGlzLl9uZXdzbGV0dGVyKCk7XHJcbiAgfSxcclxuXHJcbiAgX25ld3NsZXR0ZXI6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYDxkaXYgY2xhc3M9XCJuZXdzbGV0dGVyLWNvbmZpcm1cIj5cclxuICAgICAgPGRpdiBjbGFzcz1cIm5ld3NsZXR0ZXItY29uZmlybS0tY29udGVudFwiPlxyXG4gICAgICAgIDxwIGNsYXNzPVwidGl0bGVcIj5PYnJpZ2FkbyBwb3Igc2UgY2FkYXN0cmFyITwvcD5cclxuICAgICAgICA8c3Bhbj5FbSBicmV2ZSB2b2PDqiByZWNlYmVyw6Egbm9zc2FzIG5vdmlkYWRlcy48L3NwYW4+XHJcbiAgICAgICAgPGEgY2xhc3M9XCJsaW5rIGNsb3NlXCIgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPkZlY2hhcjwvYT5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5gO1xyXG5cclxuICAgICQoJ2JvZHknKS5hcHBlbmQocmVzcG9uc2UpO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcubmV3c2xldHRlci1jb25maXJtIC5saW5rLmNsb3NlJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgJCgnLm5ld3NsZXR0ZXItY29uZmlybScpLmZhZGVPdXQoKTtcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIFNQTWFza0JlaGF2aW9yID0gZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICByZXR1cm4gdmFsLnJlcGxhY2UoL1xcRC9nLCAnJykubGVuZ3RoID09PSAxMSA/ICcoMDApIDAwMDAwLTAwMDAnIDogJygwMCkgMDAwMC0wMDAwOSc7XHJcbiAgICB9LFxyXG4gICAgc3BPcHRpb25zID0ge1xyXG4gICAgICBvbktleVByZXNzOiBmdW5jdGlvbih2YWwsIGUsIGZpZWxkLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICBmaWVsZC5tYXNrKFNQTWFza0JlaGF2aW9yLmFwcGx5KHt9LCBhcmd1bWVudHMpLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgICQoJy5mb290ZXItYW1pc3NpbWEtLW5ld3NsZXR0ZXIgLmZvcm0gaW5wdXRbbmFtZT1cInBob25lXCJdJykubWFzayhTUE1hc2tCZWhhdmlvciwgc3BPcHRpb25zKTtcclxuXHJcbiAgICAkKCcuZm9vdGVyLWFtaXNzaW1hLS1uZXdzbGV0dGVyIC5mb3JtJykudmFsaWRhdGUoe1xyXG4gICAgICBzdWJtaXRIYW5kbGVyOiBmdW5jdGlvbihmb3JtKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IHVybCA9ICQoZm9ybSkuYXR0cignYWN0aW9uJylcclxuICAgICAgICBjb25zdCB0eXBlID0gJChmb3JtKS5hdHRyKCdtZXRob2QnKVxyXG5cclxuXHJcbiAgICAgICAgbGV0IF9uYW1lID0gJChmb3JtKS5maW5kKCdpbnB1dFtuYW1lPVwibmFtZVwiXScpLnZhbCgpO1xyXG4gICAgICAgIGxldCBlbWFpbCA9ICQoZm9ybSkuZmluZCgnaW5wdXRbbmFtZT1cImVtYWlsXCJdJykudmFsKCk7XHJcbiAgICAgICAgbGV0IHBob25lID0gJChmb3JtKS5maW5kKCdpbnB1dFtuYW1lPVwicGhvbmVcIl0nKS52YWwoKTtcclxuXHJcbiAgICAgICAgbGV0IGZpcnN0X25hbWUgPSBfbmFtZS5zcGxpdCgnICcpWzBdIHx8ICcnO1xyXG4gICAgICAgIGxldCBsYXN0X25hbWUgPSBfbmFtZS5zdWJzdHJpbmcoZmlyc3RfbmFtZS5sZW5ndGgpLnRyaW0oKSB8fCAnJztcclxuXHJcblxyXG4gICAgICAgIGxldCBkYXRhID0ge1xyXG4gICAgICAgICAgJ2lzTmV3c2xldHRlck9wdEluJzogdHJ1ZSxcclxuICAgICAgICAgICdlbWFpbCc6IGVtYWlsLFxyXG4gICAgICAgICAgJ2hvbWVQaG9uZSc6IHBob25lLFxyXG4gICAgICAgICAgJ2ZpcnN0TmFtZSc6IGZpcnN0X25hbWUsXHJcbiAgICAgICAgICAnbGFzdE5hbWUnOiBsYXN0X25hbWVcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2RhdGEnLCBkYXRhKTtcclxuXHJcbiAgICAgICAgbGV0IHBvc3QgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ2VtYWlsJywgZW1haWwpO1xyXG5cclxuXHJcblxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICBkYXRhOiBwb3N0LFxyXG4gICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi92bmQudnRleC5kcy52MTAranNvbicsXHJcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KS50aGVuKHJlc3BvbnNlID0+IHtcclxuXHJcbiAgICAgICAgICAvLyBhbGVydCgnQ2FkYXN0cm8gcmVhbGl6YWRvJyk7XHJcbiAgICAgICAgICAkKCcubmV3c2xldHRlci1jb25maXJtJykuZmFkZUluKCk7XHJcbiAgICAgICAgICAkKCcuZm9vdGVyLWFtaXNzaW1hLS1uZXdzbGV0dGVyIC5mb3JtJykuZmluZCgnaW5wdXQnKS52YWwoJycpO1xyXG4gICAgICAgIH0sIGVycm9yID0+IHtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgY29uc29sZS5lcnJvcignZXJyb3InLCBlcnJvcilcclxuICAgICAgICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShlcnJvci5yZXNwb25zZVRleHQpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICB2YXIgbGFiZWxOdWxsID0gJCgnLmlucHV0LWRlZmF1bHRbdHlwZT1cImVtYWlsXCJdJykubmV4dCgpLmxlbmd0aCA+IDA7XHJcbiAgICAgICAgICBpZihsYWJlbE51bGwpIHtcclxuICAgICAgICAgICAgJCgnLmlucHV0LWRlZmF1bHRbdHlwZT1cImVtYWlsXCJdJykubmV4dCgpLnRleHQoJ0VzdGUgZS1tYWlsIDxici8+asOhIGVzdMOhIGNhZGFzdHJhZG8uJykuc2hvdygpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJCgnLmlucHV0LWNvbnRyb2wnKS5lcSgxKS5hcHBlbmQoJzxsYWJlbCBpZD1cImVtYWlsLWVycm9yXCIgY2xhc3M9XCJlcnJvclwiIGZvcj1cImVtYWlsXCI+RXN0ZSBlLW1haWwgPGJyLz5qw6EgZXN0w6EgY2FkYXN0cmFkby48L2xhYmVsPicpLnNob3coKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICAvLyBhbGVydChtZXNzYWdlLk1lc3NhZ2UpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfSxcclxuXHJcblxyXG4gIF9pc0xvZ2dlZEluOiBmdW5jdGlvbigpIHtcclxuICAgIHZ0ZXhqcy5jaGVja291dC5nZXRPcmRlckZvcm0oKS5kb25lKGZ1bmN0aW9uKG9yZGVyRm9ybSkge1xyXG4gICAgICAvLyBmYXogYSB2ZXJpZmljYcOnw6NvIG5vIGF0cmlidXRvIGxvZ2dlZEluXHJcbiAgICAgIGlmIChvcmRlckZvcm0ubG9nZ2VkSW4pIHtcclxuICAgICAgICB2YXIgbmFtZSA9IG9yZGVyRm9ybS5jbGllbnRQcm9maWxlRGF0YS5maXJzdE5hbWU7XHJcbiAgICAgICAgdmFyIGVtYWlsID0gb3JkZXJGb3JtLmNsaWVudFByb2ZpbGVEYXRhLmVtYWlsO1xyXG4gICAgICAgIHZhciB1c2VyO1xyXG4gICAgICAgIG5hbWUgPT09IG51bGwgPyB1c2VyID0gZW1haWwgOiB1c2VyID0gbmFtZTtcclxuICAgICAgICAvLyB2YXIgaGVsY29tZSA9ICQoJy5hY2NvdW50LXVzZXInKS50ZXh0KCkucmVwbGFjZSgne3t1c2VyfX0nLCB1c2VyKVxyXG5cclxuICAgICAgICAkKCcuaGVhZGVyLWFtaXNzaW1hJykuZmluZCgnLndlbGNvbWUgLnRleHQnKS50ZXh0KGBPbMOhLCAke25hbWV9YClcclxuICAgICAgICAkKCcuaGVhZGVyLWFtaXNzaW1hJykuZmluZCgnLmFjY291bnQgLnRleHQnKS50ZXh0KGBPbMOhLCAke25hbWV9YClcclxuICAgICAgICAvLyAkKCcuaGVhZGVyLWFtaXNzaW1hIC5saW5rLWxvZ2luJykuZmluZCgnLmxvZ291dCcpLnNob3coKVxyXG5cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyB2YXIgaGVsY29tZSA9ICQoJy5hY2NvdW50LXVzZXInKS50ZXh0KCkucmVwbGFjZSgne3t1c2VyfX0nLCAnZmHDp2Egc2V1IGxvZ2luJylcclxuICAgICAgICAvLyAkKCcuaGVhZGVyLWFtaXNzaW1hIC5saW5rLWxvZ2luJykuZmluZCgnLndlbGNvbWUnKS5odG1sKCc8YSBocmVmPVwiL2xvZ2luXCIgdGl0bGU9XCJsb2dpblwiPk9sw6EsIGZhw6dhIHNldSBsb2dpbjwvYT4nKVxyXG4gICAgICAgIC8vICQoJy5oZWFkZXItYW1pc3NpbWEgLmxpbmstbG9naW4nKS5maW5kKCcubG9nb3V0JykuaGlkZSgpXHJcbiAgICAgICAgLy8gJCgnLmhlYWRlci1hbWlzc2ltYSAubGluay1sb2dpbicpLmZpbmQoJy5saW5rJykuaGlkZSgpXHJcbiAgICAgICAgY29uc29sZS5sb2coJ07Do28gbG9nYWRvJylcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgYmluZDogZnVuY3Rpb24oKXtcclxuICB9LFxyXG5cclxuICByZW1vdmVIZWxwZXJDb21wbGVtZW50OiBmdW5jdGlvbigpIHtcclxuICAgICQoJ1tpZF49XCJoZWxwZXJDb21wbGVtZW50X1wiXScpLnJlbW92ZSgpO1xyXG4gIH0sXHJcbn0pO1xyXG4iLCJBUFAuY29tcG9uZW50LkhlYWRlciA9IFZ0ZXhDbGFzcy5leHRlbmQoe1xyXG4gIC8vIGluaXRcclxuICBpbml0OiBmdW5jdGlvbiAocHJvcHMpIHtcclxuICAgIHRoaXMuZWxlbWVudCA9ICQocHJvcHMuc2VsZWN0b3IpO1xyXG5cclxuICAgIGlmICh0aGlzLmVsZW1lbnQgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgdGhpcy5sb2FkKCk7XHJcbiAgICAgIHRoaXMuY2xpY2tJdGVtU3VibWVudSgpO1xyXG4gICAgICB0aGlzLmNsaWNrQ29udHJvbHNFbGVtZW50cygpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIGxvYWRcclxuICBsb2FkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmxvZ291dCgpO1xyXG4gICAgdGhpcy5jaGVja0xvZ2luKCk7XHJcbiAgICB0aGlzLmNhcnRPcGVuKCk7XHJcblxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMub25TY3JvbGwuYmluZCh0aGlzKSwgZmFsc2UpO1xyXG4gIH0sXHJcblxyXG4gIC8vIGNhcnQgY2xpY2sgb3V0XHJcbiAgY2FydENsaWNrT3V0OiBmdW5jdGlvbiAoZXZlbnQsIGVsZW1lbnQsIGNhcnQpIHtcclxuICAgIGlmIChldmVudCBpbnN0YW5jZW9mIE9iamVjdCA9PT0gZmFsc2UgfHxcclxuICAgICAgICBlbGVtZW50IGluc3RhbmNlb2YgT2JqZWN0ID09PSBmYWxzZSB8fFxyXG4gICAgICAgIGNhcnQgaW5zdGFuY2VvZiBPYmplY3QgPT09IGZhbHNlKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgY29uc3QgcHJvcGVydGllcyA9IGVsZW1lbnRbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblxyXG4gICAgaWYgKHByb3BlcnRpZXMgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgY29uc3QgeCA9IGV2ZW50LnBhZ2VYO1xyXG4gICAgICBjb25zdCB5ID0gZXZlbnQucGFnZVk7XHJcblxyXG4gICAgICBpZiAoeCA8IHByb3BlcnRpZXMubGVmdCB8fCB4ID4gKHByb3BlcnRpZXMubGVmdCArIHByb3BlcnRpZXMud2lkdGgpXHJcbiAgICAgICAgfHwgeSA8IHByb3BlcnRpZXMudG9wIHx8IHkgPiAocHJvcGVydGllcy50b3AgKyBwcm9wZXJ0aWVzLkhlYWRlcikpIHtcclxuICAgICAgICAgIGNhcnQub3BlbkNsb3NlQ2FydChmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBjYXJ0IG9wZW5cclxuICBjYXJ0T3BlbjogZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgYnV0dG9uID0gdGhpcy5lbGVtZW50LmZpbmQoJy5oZWFkZXItYW1pc3NpbWEtLWNhcnQtLW9wZW4nKTtcclxuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuZmluZCgnLmhlYWRlci1hbWlzc2ltYS0tY2FydC0tY29udGVudCcpO1xyXG5cclxuICAgIGlmIChidXR0b24gaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgY29uc3QgY2FydCA9IG5ldyBBUFAuY29tcG9uZW50LkNhcnRNaW5pKHsgZWxlbWVudDogZWxlbWVudCB9KTtcclxuXHJcbiAgICAgIGJ1dHRvbi5vbignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgY2hlY2sgPSBjYXJ0LnRvZ2dsZSgpO1xyXG5cclxuICAgICAgICBpZiAoY2hlY2sgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgJCh3aW5kb3cpLm9uKCdjbGljaycsIGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgdGhpcy5jYXJ0Q2xpY2tPdXQoZXZlbnQsIGVsZW1lbnQsIGNhcnQpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICQod2luZG93KS5vZmYoJ2NsaWNrJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBjaGVjayBsb2dpblxyXG4gIGNoZWNrTG9naW46IGZ1bmN0aW9uICgpIHtcclxuICAgIHZ0ZXhqcy5jaGVja291dC5nZXRPcmRlckZvcm0oKS5kb25lKG9yZGVyRm9ybSA9PiB7XHJcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuZmluZCgnLmhlYWRlci1hbWlzc2ltYS0tY2FydC1sb2dpbicpO1xyXG5cclxuICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAkKGVsZW1lbnQpLmF0dHIoJ2RhdGEtbG9naW4nLCBvcmRlckZvcm0ubG9nZ2VkSW4pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvLyBjbGljayBpdGVtIHN1Ym1lbnUgLSBNT0JJTEVcclxuICBjbGlja0l0ZW1TdWJtZW51OiBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBpdGVtcyA9IHRoaXMuZWxlbWVudC5maW5kKCcuaGVhZGVyLWFtaXNzaW1hLS1tZW51LS1pdGVtW2RhdGEtc3VibWVudT1cInRydWVcIl0gPiAubGluayA+IHNwYW4nKTtcclxuXHJcbiAgICBpZiAoaXRlbXMgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgJC5lYWNoKGl0ZW1zLCAoaW5kZXgsIGVsZW1lbnQpID0+IHtcclxuICAgICAgICBjb25zdCBpdGVtID0gJChlbGVtZW50KTtcclxuXHJcbiAgICAgICAgaWYgKGl0ZW0gaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAgIGl0ZW0ub24oJ2NsaWNrJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDbGlxdWUnKTtcclxuICAgICAgICAgICAgaWYod2luZG93LmlubmVyV2lkdGggPCA3Njgpe1xyXG4gICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICBpdGVtLnBhcmVudHMoKS5hdHRyKCdkYXRhLWFjdGl2ZScsIGl0ZW0ucGFyZW50KCkuYXR0cignZGF0YS1hY3RpdmUnKSA9PT0gJ3RydWUnID8gZmFsc2UgOiB0cnVlKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBjb250cm9scyBtb2JpbGVcclxuICBjbGlja0NvbnRyb2xzRWxlbWVudHM6IGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IGNvbnRyb2xzID0gdGhpcy5lbGVtZW50LmZpbmQoJy5oZWFkZXItYW1pc3NpbWEtLW1vYmlsZS1jb250cm9scyA+IGJ1dHRvbicpO1xyXG5cclxuICAgIGlmIChjb250cm9scyBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAkLmVhY2goY29udHJvbHMsIChpbmRleCwgZWxlbWVudCkgPT4gdGhpcy5vbkNvbnRyb2xNb2JpbGUoJChlbGVtZW50KSkpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIGxvZ291dFxyXG4gIGxvZ291dDogZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgYnRuTG9nb3V0ID0gdGhpcy5lbGVtZW50LmZpbmQoJy5sb2dvdXQnKTtcclxuXHJcbiAgICBpZiAoYnRuTG9nb3V0IGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgIGJ0bkxvZ291dC5vbignY2xpY2snLCAoKSA9PlxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICB1cmw6IFwiL25vLWNhY2hlL3VzZXIvbG9nb3V0XCJcclxuICAgICAgICB9KS5kb25lKCgpID0+IGxvY2F0aW9uLnJlbG9hZCgpKVxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIG9uIGNvbnRyb2wgb3BlbiAtIE1PQklMRVxyXG4gIG9uQ29udHJvbE1vYmlsZTogZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgIGlmIChpdGVtIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgIGl0ZW0ub24oJ2NsaWNrJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgY29uc3QgdHlwZSA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXR5cGUnKTtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IHR5cGUgIT09IHRoaXMuZWxlbWVudC5hdHRyKCdkYXRhLXR5cGUnKSA/IHR5cGUgOiAnJztcclxuICAgICAgICAkKCdib2R5JykudG9nZ2xlQ2xhc3MoJ21lbnVJc09wZW4nKTtcclxuXHJcbiAgICAgICAgdGhpcy5lbGVtZW50LmF0dHIoJ2RhdGEtdHlwZScsIHZhbHVlKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gb24gc2Nyb2xsXHJcbiAgb25TY3JvbGw6IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciB0b3AgID0gd2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3A7XHJcblxyXG4gICAgaWYgKHRoaXMuZWxlbWVudCBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICB0aGlzLmVsZW1lbnQuYXR0cignZGF0YS1zY3JvbGwnLCB0b3AgPiAxMjApO1xyXG4gICAgfVxyXG4gIH0sXHJcbn0pO1xyXG4iLCJBUFAuY29udHJvbGxlci5Ib21lID0gVnRleENsYXNzLmV4dGVuZCh7XHJcbiAgLy8gaW5pdFxyXG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgc2VsZi5zZXR1cCgpO1xyXG4gICAgc2VsZi5zdGFydCgpO1xyXG4gICAgc2VsZi5iaW5kKCk7XHJcbiAgfSxcclxuXHJcbiAgLy8gc2V0dXBcclxuICBzZXR1cDogZnVuY3Rpb24oKSB7XHJcbiAgfSxcclxuXHJcbiAgLy8gc3RhcnRcclxuICBzdGFydDogZnVuY3Rpb24oKSB7XHJcbiAgICAvLyBhbWlzc2ltYSBob21lIGJhbm5lclxyXG4gICAgJCgnLmFtaXNzaW1hLWhvbWUtLWJhbm5lcnMtbW9iaWxlJykuc2xpY2soe1xyXG4gICAgICBkb3RzOiB0cnVlLFxyXG4gICAgICBhZGFwdGl2ZUhlaWdodDogdHJ1ZSxcclxuICAgICAgbW9iaWxlRmlyc3Q6IHRydWUsXHJcbiAgICAgIGF1dG9wbGF5OiBmYWxzZSxcclxuICAgICAgcmVzcG9uc2l2ZTogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGJyZWFrcG9pbnQ6IDEwMjUsXHJcbiAgICAgICAgICBzZXR0aW5nczogXCJ1bnNsaWNrXCIsXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgYnJlYWtwb2ludDogMTAyNCxcclxuICAgICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxLFxyXG4gICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDEsXHJcbiAgICAgICAgICAgIGFycm93czogZmFsc2UsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgXVxyXG4gICAgfSk7XHJcbiAgICAkKCcuYW1pc3NpbWEtaG9tZS0td2ViZG9vci0tZGVza3RvcCcpLnNsaWNrKHtcclxuICAgICAgZG90czogZmFsc2UsXHJcbiAgICAgIGFkYXB0aXZlSGVpZ2h0OiB0cnVlLFxyXG4gICAgICBtb2JpbGVGaXJzdDogdHJ1ZSxcclxuICAgICAgcGF1c2VPbkhvdmVyOiBmYWxzZSxcclxuICAgICAgYXV0b3BsYXk6IHRydWUsXHJcbiAgICAgIGF1dG9wbGF5U3BlZWQ6IDI1MDAsXHJcbiAgICAgIHJlc3BvbnNpdmU6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBicmVha3BvaW50OiAxMDI0LFxyXG4gICAgICAgICAgc2V0dGluZ3M6IFwidW5zbGlja1wiLFxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgIGJyZWFrcG9pbnQ6IDEwMjUsXHJcbiAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICBzbGlkZXNUb1Njcm9sbDogMSxcclxuICAgICAgICAgICAgc2xpZGVzVG9TaG93OiAxLFxyXG4gICAgICAgICAgICBhcnJvd3M6IHRydWUsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgXVxyXG4gICAgfSk7XHJcbiAgICAkKCcuYW1pc3NpbWEtaG9tZS0tb2ZmLXNhbGUnKS5zbGljayh7XHJcbiAgICAgIGRvdHM6IGZhbHNlLFxyXG4gICAgICBhZGFwdGl2ZUhlaWdodDogdHJ1ZSxcclxuICAgICAgbW9iaWxlRmlyc3Q6IHRydWUsXHJcbiAgICAgIHBhdXNlT25Ib3ZlcjogZmFsc2UsXHJcbiAgICAgIGF1dG9wbGF5OiB0cnVlLFxyXG4gICAgICBhdXRvcGxheVNwZWVkOiAyNTAwLFxyXG4gICAgICByZXNwb25zaXZlOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgYnJlYWtwb2ludDogMTAyNCxcclxuICAgICAgICAgIHNldHRpbmdzOiBcInVuc2xpY2tcIixcclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICBicmVha3BvaW50OiAxMDI1LFxyXG4gICAgICAgICAgc2V0dGluZ3M6IHtcclxuICAgICAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDEsXHJcbiAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogMSxcclxuICAgICAgICAgICAgYXJyb3dzOiBmYWxzZSxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICBdXHJcbiAgICB9KTtcclxuICAgICQoJy5hbWlzc2ltYS1ob21lLS13ZWJkb29yLS1tb2JpbGUnKS5zbGljayh7XHJcbiAgICAgIGRvdHM6IHRydWUsXHJcbiAgICAgIGFkYXB0aXZlSGVpZ2h0OiB0cnVlLFxyXG4gICAgICBtb2JpbGVGaXJzdDogdHJ1ZSxcclxuICAgICAgYXV0b3BsYXk6IHRydWUsXHJcbiAgICAgIGF1dG9wbGF5U3BlZWQ6IDUwMDAsXHJcbiAgICAgIHJlc3BvbnNpdmU6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBicmVha3BvaW50OiAxMDI1LFxyXG4gICAgICAgICAgc2V0dGluZ3M6IFwidW5zbGlja1wiLFxyXG4gICAgICAgIH0sIHtcclxuICAgICAgICAgIGJyZWFrcG9pbnQ6IDEwMjQsXHJcbiAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICBzbGlkZXNUb1Njcm9sbDogMSxcclxuICAgICAgICAgICAgc2xpZGVzVG9TaG93OiAxLFxyXG4gICAgICAgICAgICBhcnJvd3M6IGZhbHNlLFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgIF1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIHNoZWxmXHJcbiAgICAkKCcuYW1pc3NpbWEtLXNoZWxmIHVsJykuc2xpY2soe1xyXG4gICAgICBhcnJvd3M6IHRydWUsXHJcbiAgICAgIGluZmluaXRlOiBmYWxzZSxcclxuICAgICAgc2xpZGVzVG9TaG93OiA0LFxyXG4gICAgICBzbGlkZXNUb1Njcm9sbDogMSxcclxuICAgICAgICByZXNwb25zaXZlOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgYnJlYWtwb2ludDogOTk5OSxcclxuICAgICAgICAgICAgc2V0dGluZ3M6IHtcclxuICAgICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDQsXHJcbiAgICAgICAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDEsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgYnJlYWtwb2ludDogMTAyNCxcclxuICAgICAgICAgICAgc2V0dGluZ3M6IHtcclxuICAgICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDIsXHJcbiAgICAgICAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDEsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXVxyXG4gICAgfSk7XHJcblxyXG5cclxuXHJcbiAgICAvLyB0aGlzLmluc3RhZ3JhbSgpO1xyXG4gICAgIHRoaXMuaW5zdGFncmFtU3RhdGljKCk7XHJcblxyXG4gICAgbmV3IEFQUC5jb21wb25lbnQuU2hlbGYoJCgnLmFtaXNzaW1hLS1zaGVsZicpWzBdKVxyXG4gIH0sXHJcblxyXG4gIGluc3RhZ3JhbTogZnVuY3Rpb24oKSB7XHJcbiAgICAvLyBJbnNncmFtIHVzZXIgVG9rZW5cclxuICAgIC8vIHZhciB0b2tlbiA9ICQoJyNpbnN0YWdyYW1Ub2tlbicpLnRleHQoKS5yZXBsYWNlKCcgJywgJycpO1xyXG4gICAgdmFyIHRva2VuID0gJCgnI2luc3RhZ3JhbVRva2VuJykudGV4dCgpLnJlcGxhY2UoJyAnLCAnJyk7XHJcbiAgICAvLyBJbnNncmFtIHVzZXIgSURcclxuICAgIHZhciB1c2VyaWQgPSAnMzEwODEwMjIyJztcclxuICAgIC8vIE51bWJlciBvZiBwaWN0dXJlc1xyXG4gICAgdmFyIG51bV9waG90b3MgPSA0O1xyXG5cclxuXHJcblxyXG4gICAgJC5hamF4KHtcclxuICAgICAgdXJsOiAnaHR0cHM6Ly9hcGkuaW5zdGFncmFtLmNvbS92MS91c2Vycy8nICsgdXNlcmlkICsgJy9tZWRpYS9yZWNlbnQnLFxyXG4gICAgICBkYXRhVHlwZTogJ2pzb25wJyxcclxuICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgIGRhdGE6IHtcclxuICAgICAgICBhY2Nlc3NfdG9rZW46IHRva2VuLFxyXG4gICAgICAgIGNvdW50OiBudW1fcGhvdG9zXHJcbiAgICAgIH0sXHJcbiAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZygnZGF0YScsIGRhdGEpO1xyXG4gICAgICAgICQoJy5hbWlzc2ltYS1ob21lLS1pbnN0YWdyYW0tLWxpc3QnKS5hcHBlbmQoJzx1bD48L3VsPicpO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEuZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgJCgnLmFtaXNzaW1hLWhvbWUtLWluc3RhZ3JhbS0tbGlzdCB1bCcpLmFwcGVuZCgnPGxpPjxkaXYgY2xhc3M9XCJob21lX19pbnN0YWdyYW0tLWltYWdlXCI+PGEgaHJlZj1cIicgKyBkYXRhLmRhdGFbaV0ubGluayArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj48ZmlndXJlPjxpbWcgc3JjPVwiJyArIGRhdGEuZGF0YVtpXS5pbWFnZXMubG93X3Jlc29sdXRpb24udXJsICsgJ1wiPjwvZmlndXJlPjwvYT48L2Rpdj48L2xpPicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gYW1pc3NtaWEgaW5zdGFncmFtXHJcbiAgICAgICAgJCgnLmFtaXNzaW1hLWhvbWUtLWluc3RhZ3JhbS0tbGlzdCB1bCcpLnNsaWNrKHtcclxuICAgICAgICAgIGRvdHM6IGZhbHNlLFxyXG4gICAgICAgICAgYXJyb3dzOiB0cnVlLFxyXG4gICAgICAgICAgc2xpZGVzVG9TaG93OiAxLFxyXG4gICAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDEsXHJcbiAgICAgICAgICBtb2JpbGVGaXJzdDogdHJ1ZSxcclxuICAgICAgICAgIGF1dG9wbGF5OiBmYWxzZSxcclxuICAgICAgICAgIHJlc3BvbnNpdmU6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGJyZWFrcG9pbnQ6IDc2OSxcclxuICAgICAgICAgICAgICBzZXR0aW5nczogXCJ1bnNsaWNrXCIsXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICBicmVha3BvaW50OiA3NjgsXHJcbiAgICAgICAgICAgICAgc2V0dGluZ3M6IHtcclxuICAgICAgICAgICAgICAgIGFycm93czogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogMSxcclxuICAgICAgICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxLFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIF1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgIH0sXHJcbiAgICAgIGVycm9yOiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0sXHJcbiAgaW5zdGFncmFtU3RhdGljOiBmdW5jdGlvbigpe1xyXG4gICAgJCgnLmFtaXNzaW1hLWhvbWUtLWluc3RhZ3JhbS0taXRlbXMnKS5zbGljayh7XHJcbiAgICAgIGRvdHM6IGZhbHNlLFxyXG4gICAgICBhcnJvd3M6IHRydWUsXHJcbiAgICAgIHNsaWRlc1RvU2hvdzogMSxcclxuICAgICAgc2xpZGVzVG9TY3JvbGw6IDEsXHJcbiAgICAgIG1vYmlsZUZpcnN0OiB0cnVlLFxyXG4gICAgICBhdXRvcGxheTogZmFsc2UsXHJcbiAgICAgIHJlc3BvbnNpdmU6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBicmVha3BvaW50OiA3NjksXHJcbiAgICAgICAgICBzZXR0aW5nczogXCJ1bnNsaWNrXCIsXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgYnJlYWtwb2ludDogNzY4LFxyXG4gICAgICAgICAgc2V0dGluZ3M6IHtcclxuICAgICAgICAgICAgYXJyb3dzOiB0cnVlLFxyXG4gICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDEsXHJcbiAgICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxLFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgIF1cclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIC8vIGJpbmRcclxuICBiaW5kOiBmdW5jdGlvbigpIHtcclxuICB9XHJcbn0pO1xyXG4iLCJcclxuQVBQLmNvbnRyb2xsZXIuTG9naW4gPSBWdGV4Q2xhc3MuZXh0ZW5kKHtcclxuICBpbml0OiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHNlbGYuc2V0dXAoKVxyXG4gICAgc2VsZi5zdGFydCgpXHJcbiAgICBzZWxmLmJpbmQoKVxyXG5cclxuICB9LFxyXG5cclxuXHJcblxyXG4gIHNldHVwOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgfSxcclxuXHJcbiAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgJChcImJvZHlcIikub24oXCJjbGlja1wiLCBcIi52dGV4SWRVSSAubW9kYWwtaGVhZGVyIC5jbG9zZVwiLCBmdW5jdGlvbihlKXtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IFwiL1wiO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICAkKHdpbmRvdykubG9hZChmdW5jdGlvbigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnTGVuOiAnLCAkKCcudnRleElkVUktcHJvdmlkZXJzLWJ0bicpLmxlbmd0aCk7XHJcbiAgICAgICAgJCgnLnZ0ZXhJZFVJLXByb3ZpZGVycy1idG4nKS5yZW1vdmVBdHRyKCd0YWJpbmRleCcpO1xyXG4gICAgfSk7XHJcblxyXG5cclxuICB9LFxyXG5cclxuXHJcblxyXG5cclxuXHJcbiAgYmluZDogZnVuY3Rpb24oKSB7XHJcblxyXG4gIH1cclxuXHJcbn0pO1xyXG4iLCJBUFAuY29udHJvbGxlci5OZW9hQXNpc3QgPSBWdGV4Q2xhc3MuZXh0ZW5kKHtcclxuICBpbml0OiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHNlbGYuc2V0dXAoKTtcclxuICAgIHNlbGYuc3RhcnQoKTtcclxuICAgIHNlbGYuYmluZCgpO1xyXG4gIH0sXHJcblxyXG4gIHNldHVwOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgfSxcclxuXHJcbiAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICB9LFxyXG5cclxuICBiaW5kOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgfVxyXG59KTtcclxuIiwiQVBQLmNvbnRyb2xsZXIuUHJvZHVjdCA9IFZ0ZXhDbGFzcy5leHRlbmQoe1xyXG4gIC8vIGluaXRcclxuICBpbml0OiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHNlbGYuc2V0dXAoKVxyXG4gICAgc2VsZi5zdGFydCgpXHJcbiAgICBzZWxmLmJpbmQoKVxyXG5cclxuICB9LFxyXG5cclxuICAvLyBzZXR1cFxyXG4gIHNldHVwOiBmdW5jdGlvbigpIHt9LFxyXG5cclxuICAvLyBzdGFydFxyXG4gIHN0YXJ0OiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuYnV5QnV0dG9uKClcclxuICAgIHRoaXMuYnV5QnV0dG9uQ29uZmlybSgpXHJcbiAgICB0aGlzLnByb2R1Y3RHYWxsZXJ5KClcclxuICAgIHRoaXMucHJvZHVjdFZpZGVvKClcclxuXHJcbiAgICB0aGlzLmRlc2NyaXB0aW9uUHJvZHVjdFRleHQoKVxyXG4gICAgdGhpcy5kZXNjcmlwdGlvblRhYnMoKVxyXG5cclxuICAgIHRoaXMuY29sb3JzVHJhbnNmb3JtKClcclxuICAgIHRoaXMuc2hhcmVkKClcclxuICAgIHRoaXMuY2hhbmdlU2t1KClcclxuICAgIC8vIHRoaXMuc2Nyb2xsQnV0dG9tRnVuY3Rpb24oKVxyXG5cclxuICAgIGNvbnN0IHNoZWxmID0gbmV3IEFQUC5jb21wb25lbnQuU2hlbGYoKVxyXG4gICAgc2hlbGYuc2t1UHJvZHVjdCgkKCcuYW1pc3NpbWEtLXNoZWxmJykpXHJcblxyXG4gICAgJCgnLmFtaXNzaW1hLS1zaGVsZiB1bCcpLnNsaWNrKHtcclxuICAgICAgYXJyb3dzOiB0cnVlLFxyXG4gICAgICBpbmZpbml0ZTogZmFsc2UsXHJcbiAgICAgIHNsaWRlc1RvU2hvdzogNCxcclxuICAgICAgc2xpZGVzVG9TY3JvbGw6IDEsXHJcbiAgICAgIHJlc3BvbnNpdmU6IFt7XHJcbiAgICAgICAgYnJlYWtwb2ludDogMTAyNCxcclxuICAgICAgICBzZXR0aW5nczogXCJ1bnNsaWNrXCJcclxuICAgICAgfSwge1xyXG4gICAgICAgIGJyZWFrcG9pbnQ6IDEwMjMsXHJcbiAgICAgICAgc2V0dGluZ3M6IHtcclxuICAgICAgICAgIHNsaWRlc1RvU2hvdzogMixcclxuICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxLFxyXG4gICAgICAgIH1cclxuICAgICAgfSwgXVxyXG4gICAgfSlcclxuICB9LFxyXG5cclxuXHJcbiAgZ2V0VmFyaWF0aW9uczogZnVuY3Rpb24oc2t1KSB7XHJcblxyXG4gICAgcmV0dXJuICQuYWpheCh7XHJcbiAgICAgIHVybDogJy9hcGkvY2F0YWxvZ19zeXN0ZW0vcHViL3Byb2R1Y3RzL3ZhcmlhdGlvbnMvJyArIHNrdSxcclxuICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgIGRhdGFUeXBlOiAnSlNPTicsXHJcbiAgICAgIGFzeW5jOiB0cnVlXHJcbiAgICB9KS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuXHJcbiAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLy9DaGFuZ2Ugc2t1XHJcbiAgY2hhbmdlU2t1OiBmdW5jdGlvbigpIHtcclxuICAgIGxldCBfdGhhdCA9IHRoaXM7XHJcbiAgICAkKCcuaXRlbS1kaW1lbnNpb24tQ29yJykub24oJ2NoYW5nZScsICcuc2t1LXNlbGVjdG9yJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgIGxldCBjb3IgPSAkKHRoaXMpLmRhdGEoJ3ZhbHVlJyk7XHJcbiAgICAgIGxldCBjdXJyZW50U2t1O1xyXG4gICAgICBsZXQgY3VycmVudFByb2R1Y3Q7XHJcblxyXG4gICAgICBsZXQgcHJvZHVjdElEID0gc2t1SnNvbl8wLnByb2R1Y3RJZDtcclxuXHJcbiAgICAgIF90aGF0LmdldFZhcmlhdGlvbnMocHJvZHVjdElEKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnZGF0YScsIGRhdGEpO1xyXG4gICAgICAgICQuZWFjaChkYXRhLnNrdXMsIGZ1bmN0aW9uKGtleSwgaXRlbSkge1xyXG4gICAgICAgICAgaWYgKGl0ZW0uZGltZW5zaW9ucy5Db3IgPT09IGNvcikge1xyXG4gICAgICAgICAgICBjdXJyZW50U2t1ID0gaXRlbS5za3U7XHJcbiAgICAgICAgICAgIGN1cnJlbnRQcm9kdWN0ID0gaXRlbS5za3VuYW1lO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaXRlbScsIGl0ZW0pO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgX3RoYXQucHJvZHVjdEdhbGxlcnkoY3VycmVudFNrdSlcclxuICAgICAgICBfdGhhdC5wcm9kdWN0VmlkZW8oY3VycmVudFNrdSlcclxuXHJcblxyXG5cclxuICAgICAgfSk7XHJcblxyXG5cclxuXHJcbiAgICB9KTtcclxuXHJcblxyXG4gIH0sXHJcblxyXG4gIC8vIGJ1eSBidXR0b25cclxuICBidXlCdXR0b246IGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgYnV0dG9uID0gJCgnLnByb2R1Y3RfX2luZm8tLWJ1eSAuYnV5LWJ1dHRvbicpXHJcblxyXG4gICAgaWYgKGJ1dHRvbi5sZW5ndGggPiAwKSB7XHJcblxyXG4gICAgICBidXR0b24ub2ZmKCdjbGljaycpLm9uKCdjbGljaycsIGV2ZW50ID0+IHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXHJcblxyXG4gICAgICAgIGNvbnN0IGhyZWYgPSBidXR0b24uYXR0cignaHJlZicpXHJcblxyXG4gICAgICAgIGlmIChocmVmLm1hdGNoKC9qYXZhc2NyaXB0OmFsZXJ0L2cpKSB7XHJcbiAgICAgICAgICB0aGlzLmJ1eUVycm9yKGhyZWYpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICQoJy5wcm9kdWN0X19pbmZvLS1wcmljZSAuZXJyb3InKS5yZW1vdmUoKVxyXG4gICAgICAgICAgdGhpcy5idXlTZW5kKGhyZWYpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBidXkgYnV0dG9uIGNvbmZpcm1cclxuICBidXlCdXR0b25Db25maXJtOiBmdW5jdGlvbigpIHtcclxuICAgIGNvbnN0IGJ0bkNvbnRpbnVlID0gJCgnLnByb2R1Y3RfX2J1eS0tc2VsbC0tY29udGVudCAubGluay5idG4nKVxyXG4gICAgYnRuQ29udGludWUub24oJ2NsaWNrJywgKCkgPT4gJCgnYm9keScpLnJlbW92ZUNsYXNzKCdzZWxsJykpXHJcbiAgfSxcclxuXHJcbiAgLy8gYnV5IGVycm9yXHJcbiAgYnV5RXJyb3I6IGZ1bmN0aW9uKGhyZWYpIHtcclxuICAgIGNvbnN0IHBhcmVudCA9ICQoJy5wcm9kdWN0X19pbmZvLS1wcmljZScpXHJcblxyXG4gICAgaWYgKHBhcmVudC5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGNvbnN0IHRleHQgPSBocmVmLnJlcGxhY2UoXCJqYXZhc2NyaXB0OmFsZXJ0KCdcIiwgJycpLnJlcGxhY2UoXCIuJyk7XCIsICcnKVxyXG4gICAgICBjb25zdCBlbGVtZW50ID0gJChgPHAgY2xhc3M9XCJlcnJvclwiPiR7dGV4dH08L3A+YClcclxuXHJcbiAgICAgICQocGFyZW50W3BhcmVudC5sZW5ndGggLSAxXSkucHJlcGVuZChlbGVtZW50KVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIGJ1eSBzZW5kXHJcbiAgYnV5U2VuZDogZnVuY3Rpb24oaHJlZikge1xyXG4gICAgY29uc3Qgc2t1ID0gcGFyc2VJbnQodGhpcy5nZXRVcmxQYXJhbShocmVmLCAnc2t1JywgJycpLCAxMClcclxuXHJcbiAgICBpZiAodHlwZW9mIHNrdSA9PT0gJ251bWJlcicpIHtcclxuICAgICAgJC5hamF4KHtcclxuICAgICAgICB1cmw6IGAvY2hlY2tvdXQvY2FydC9hZGQ/c2t1PSR7c2t1fSZxdHk9MSZzZWxsZXI9MSZyZWRpcmVjdD10cnVlJnNjPTFgLFxyXG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgIH0pLmRvbmUoKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgIGlmIChzdGF0dXMgPT09ICdzdWNjZXNzJykge1xyXG4gICAgICAgICAgJCgnYm9keScpLmFkZENsYXNzKCdzZWxsJylcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gZ2V0IHVybCBwYXJhbVxyXG4gIGdldFVybFBhcmFtOiBmdW5jdGlvbihocmVmLCBwYXJhbWV0ZXIsIGRlZmF1bHR2YWx1ZSkge1xyXG4gICAgbGV0IHVybHBhcmFtZXRlciA9IGRlZmF1bHR2YWx1ZTtcclxuXHJcbiAgICBpZiAoaHJlZi5pbmRleE9mKHBhcmFtZXRlcikgPiAtMSkge1xyXG4gICAgICB1cmxwYXJhbWV0ZXIgPSB0aGlzLmdldFZhcnNTdHJpbmcoaHJlZilbcGFyYW1ldGVyXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdXJscGFyYW1ldGVyO1xyXG4gIH0sXHJcblxyXG4gIC8vIGdldCB2YXJzIHN0cmluZ1xyXG4gIGdldFZhcnNTdHJpbmc6IGZ1bmN0aW9uKGhyZWYpIHtcclxuICAgIGxldCB2YXJzID0ge307XHJcbiAgICBsZXQgcGFydHMgPSBocmVmLnJlcGxhY2UoL1s/Jl0rKFtePSZdKyk9KFteJl0qKS9naSwgKG0sIGtleSwgdmFsdWUpID0+IHZhcnNba2V5XSA9IHZhbHVlKTtcclxuXHJcbiAgICByZXR1cm4gdmFycztcclxuICB9LFxyXG5cclxuICAvLyBnZXQgaW1hZ2VzIHRodW1iXHJcbiAgZ2V0SW1hZ2VzVGh1bWI6IGZ1bmN0aW9uKGltYWdlcykge1xyXG4gICAgcmV0dXJuIGltYWdlcy5tYXAoZnVuY3Rpb24oaW1hZ2UpIHtcclxuICAgICAgcmV0dXJuIGltYWdlWzRdLlBhdGg7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvLyBnZXQgaW1hZ2VzIGxhcmdlXHJcbiAgZ2V0SW1hZ2VzTGFyZ2U6IGZ1bmN0aW9uKGltYWdlcykge1xyXG4gICAgcmV0dXJuIGltYWdlcy5tYXAoZnVuY3Rpb24oaW1hZ2UpIHtcclxuICAgICAgcmV0dXJuIGltYWdlWzNdLlBhdGg7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvLyBwcm9kdWN0IGdhbGxlcnlcclxuICBwcm9kdWN0R2FsbGVyeTogZnVuY3Rpb24oY3VycmVudFNrdSkge1xyXG4gICAgbGV0IF90aGF0ID0gdGhpcztcclxuICAgIGxldCBza3UgPSBjdXJyZW50U2t1IHx8IHNrdUpzb24uc2t1c1swXS5za3U7XHJcbiAgICB0aGlzLmdldFNLVURhdGEoc2t1KS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgdmFyIGltYWdlcyA9IGRhdGFbMF0uSW1hZ2VzO1xyXG4gICAgICB2YXIgbGFyZ2VIVE1MO1xyXG4gICAgICB2YXIgdGh1bWJzSFRNTDtcclxuXHJcbiAgICAgIGlmICgkKCcucHJvZHVjdF9fZ2FsbGVyeS0tcGljdHVyZXMnKS5oYXNDbGFzcygnc2xpY2staW5pdGlhbGl6ZWQnKSkge1xyXG4gICAgICAgICQoJy5wcm9kdWN0X19nYWxsZXJ5LS1waWN0dXJlcycpLnNsaWNrKCd1bnNsaWNrJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICgkKCcucHJvZHVjdF9fZ2FsbGVyeS0tdGh1bWJzJykuaGFzQ2xhc3MoJ3NsaWNrLWluaXRpYWxpemVkJykpIHtcclxuICAgICAgICAkKCcucHJvZHVjdF9fZ2FsbGVyeS0tdGh1bWJzJykuc2xpY2soJ3Vuc2xpY2snKTtcclxuICAgICAgfVxyXG5cclxuXHJcblxyXG5cclxuICAgICAgbGFyZ2VIVE1MID0gX3RoYXQuZ2V0SW1hZ2VzTGFyZ2UoaW1hZ2VzKS5yZWR1Y2UoZnVuY3Rpb24ocHJldkltYWdlLCBwcm9kSW1hZ2UpIHtcclxuICAgICAgICB2YXIgaWQgPSBwcm9kSW1hZ2UubWF0Y2goL2lkc1xcLyhcXGQrKS8pLnBvcCgpO1xyXG4gICAgICAgIHZhciB6b29tVVJMID0gcHJvZEltYWdlO1xyXG4gICAgICAgIHJldHVybiBwcmV2SW1hZ2UgKyBgPGRpdiBjbGFzcz1cImVhc3l6b29tXCI+PGEgaHJlZj1cIiR7cHJvZEltYWdlfVwiIGNsYXNzPVwicHJvZHVjdF9fZ2FsbGVyeS0tcGljdHVyZXMtLWl0ZW1cIiBkYXRhLWlkPVwiJHtpZH1cIj48aW1nIHNyYz1cIiR7cHJvZEltYWdlfVwiIGFsdD1cIlwiIC8+PC9hPjwvZGl2PmA7XHJcbiAgICAgICAgLy8gcmV0dXJuIHByZXZJbWFnZSArIGA8ZGl2IGNsYXNzPVwicHJvZHVjdF9fZ2FsbGVyeS0tcGljdHVyZXMtLWl0ZW1cIiBkYXRhLWlkPVwiJHtpZH1cIj48aW1nIHNyYz1cIiR7cHJvZEltYWdlfVwiIGFsdD1cIlwiIC8+PC9kaXY+YDtcclxuICAgICAgfSwgJycpO1xyXG5cclxuICAgICAgJCgnLnByb2R1Y3RfX2dhbGxlcnktLXBpY3R1cmVzJykuaHRtbChsYXJnZUhUTUwpLnNsaWNrKHtcclxuICAgICAgICBkb3RzOiBmYWxzZSxcclxuICAgICAgICBhcnJvd3M6IHRydWUsXHJcbiAgICAgICAgc3BlZWQ6IDQwMCxcclxuICAgICAgICBzbGlkZXNUb1Nob3c6IDIsXHJcbiAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDIsXHJcbiAgICAgICAgaW5maW5pdGU6IGZhbHNlLFxyXG4gICAgICAgIGFzTmF2Rm9yOiAnLnByb2R1Y3RfX2dhbGxlcnktLXRodW1icycsXHJcbiAgICAgICAgLy8gb25Jbml0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyB9LFxyXG4gICAgICAgIHJlc3BvbnNpdmU6IFt7XHJcbiAgICAgICAgICBicmVha3BvaW50OiA2NDAsXHJcbiAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDEsXHJcbiAgICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxLFxyXG4gICAgICAgICAgICBkb3RzOiB0cnVlLFxyXG4gICAgICAgICAgICBhcnJvd3M6IGZhbHNlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfV1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpZiAoJCh3aW5kb3cpLndpZHRoKCkgPiA3NjgpIHtcclxuICAgICAgICAgICQoJy5lYXN5em9vbScpLmVhc3lab29tKHtsb2FkaW5nTm90aWNlOiBcIkNhcnJlZ2FuZG8gaW1hZ2VtXCJ9KTtcclxuICAgICAgfVxyXG5cclxuXHJcblxyXG4gICAgICB0aHVtYnNIVE1MID0gX3RoYXQuZ2V0SW1hZ2VzVGh1bWIoaW1hZ2VzKS5yZWR1Y2UoZnVuY3Rpb24ocHJldlRodW1iLCB0aHVtYikge1xyXG4gICAgICAgIHZhciBpZCA9IHRodW1iLm1hdGNoKC9pZHNcXC8oXFxkKykvKS5wb3AoKTtcclxuICAgICAgICByZXR1cm4gcHJldlRodW1iICsgYDxkaXYgY2xhc3M9XCJwcm9kdWN0X19nYWxsZXJ5LS10aHVtYnMtdGh1bWJcIiBkYXRhLWlkPVwiJHtpZH1cIj48aW1nIHNyYz1cIiR7dGh1bWJ9XCIgYWx0PVwiXCIgLz48L2Rpdj5gO1xyXG4gICAgICB9LCAnJyk7XHJcbiAgICAgICQoJy5wcm9kdWN0X19nYWxsZXJ5LS10aHVtYnMnKS5odG1sKHRodW1ic0hUTUwpLnNsaWNrKHtcclxuICAgICAgICBkb3RzOiBmYWxzZSxcclxuICAgICAgICBpbmZpbml0ZTogZmFsc2UsXHJcbiAgICAgICAgYXJyb3dzOiB0cnVlLFxyXG4gICAgICAgIHNwZWVkOiA0MDAsXHJcbiAgICAgICAgc2xpZGVzVG9TaG93OiA1LFxyXG4gICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxLFxyXG4gICAgICAgIGZvY3VzT25TZWxlY3Q6IHRydWUsXHJcbiAgICAgICAgdmVydGljYWw6IHRydWUsXHJcbiAgICAgICAgdmVydGljYWxTd2lwaW5nOiB0cnVlLFxyXG4gICAgICAgIGFzTmF2Rm9yOiAnLnByb2R1Y3RfX2dhbGxlcnktLXBpY3R1cmVzJyxcclxuICAgICAgICBvbkFmdGVyQ2hhbmdlOiBmdW5jdGlvbihldmVudCwgc2xpY2ssIGluZGV4KSB7XHJcbiAgICAgICAgICAkKCcucHJvZHVjdF9fZ2FsbGVyeS0tdGh1bWJzIC5zbGljay1zbGlkZScpLnJlbW92ZUNsYXNzKCd0aHVtYi1hY3RpdmUnKTtcclxuICAgICAgICAgICQoJy5wcm9kdWN0X19nYWxsZXJ5LS10aHVtYnMgLnNsaWNrLWFjdGl2ZScpLmVxKDApLmFkZENsYXNzKCd0aHVtYi1hY3RpdmUnKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICAvLyBTZXQgYWN0aXZlIGNsYXNzIHRvIGZpcnN0IHRodW1ibmFpbCBzbGlkZXNcclxuICAgICAgJCgnLnByb2R1Y3RfX2dhbGxlcnktLXRodW1icyAuc2xpY2stYWN0aXZlJykuZXEoMCkuYWRkQ2xhc3MoJ3RodW1iLWFjdGl2ZScpO1xyXG5cclxuICAgICAgLy8gQ2hhbmdlIHNsaWRlIG9ubW91c2VlbnRlclxyXG4gICAgICAkKFwiLnByb2R1Y3RfX2dhbGxlcnktLXRodW1icyAuc2xpY2stc2xpZGVcIikubW91c2VlbnRlcihmdW5jdGlvbigpIHtcclxuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoXCJjbGlja1wiKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLy92aWRlb1xyXG4gIHByb2R1Y3RWaWRlbzogZnVuY3Rpb24oY3VycmVudFNrdSkge1xyXG4gICAgY29uc29sZS5sb2coJ2N1cnJlbnRTa3UnLGN1cnJlbnRTa3UpO1xyXG5cclxuICAgIGxldCBwcm9kdWN0ID0gc2t1SnNvbi5za3VzWzBdLnNrdW5hbWUucmVwbGFjZSgvIC9nLFwiLVwiKTtcclxuICAgIFxyXG4gICAgdmFyIHNldHRpbmdzID0ge1xyXG4gICAgICBcInVybFwiOiBgL2FwaS9jYXRhbG9nX3N5c3RlbS9wdWIvcHJvZHVjdHMvc2VhcmNoLyR7cHJvZHVjdH1gLFxyXG4gICAgICBcIm1ldGhvZFwiOiBcIkdFVFwiLFxyXG4gICAgICBcInRpbWVvdXRcIjogMCxcclxuICAgICAgXCJoZWFkZXJzXCI6IHtcclxuICAgICAgICBcIkFjY2VwdFwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuXHJcbiAgICAkLmFqYXgoc2V0dGluZ3MpLmRvbmUoZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgaWYoY3VycmVudFNrdSl7XHJcbiAgICAgICAgbGV0IGl0ZW1zID0gcmVzcG9uc2VbMF0uaXRlbXM7XHJcbiAgICAgICAgbGV0IGl0ZW0gPSBpdGVtcy5maWx0ZXIoZnVuY3Rpb24oY3VycmVudCkge1xyXG4gICAgICAgICAgcmV0dXJuIGN1cnJlbnQuaXRlbUlkID09IGN1cnJlbnRTa3U7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdmFyIHZpZGVvID0gaXRlbVswXS5WaWRlb3NbMF07XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIHZhciB2aWRlbyA9IHJlc3BvbnNlWzBdLml0ZW1zWzBdLlZpZGVvc1swXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYoISF2aWRlbyAmJiB2aWRlby5sZW5ndGgpe1xyXG5cclxuICAgICAgICB2aWRlbyA9IHZpZGVvLnJlcGxhY2UoJ3ZpbWVvLmNvbS8nLCAncGxheWVyLnZpbWVvLmNvbS92aWRlby8nKVxyXG5cclxuICAgICAgICB2YXIgdmltZW9WaWRlb0lEID0gdmlkZW8ucmVwbGFjZSgnaHR0cHM6Ly9wbGF5ZXIudmltZW8uY29tL3ZpZGVvLycsICcnKTtcclxuXHJcbiAgICAgICAgbGV0IHZpZGVvVGVtcGxhdGUgPSAnPGlmcmFtZSBzcmM9XCInK3ZpZGVvKyc/YXV0b3BsYXk9MSZsb29wPTEmc2lkZWRvY2s9MFwiIGFsbG93PVwiYXV0b3BsYXlcIiB3aWR0aD1cIjUwMFwiIGhlaWdodD1cIjI4MVwiIGZyYW1lYm9yZGVyPVwiMFwiPjwvaWZyYW1lPic7XHJcblxyXG4gICAgICAgICQuZ2V0SlNPTignaHR0cHM6Ly93d3cudmltZW8uY29tL2FwaS92Mi92aWRlby8nICsgdmltZW9WaWRlb0lEICsgJy5qc29uP2NhbGxiYWNrPT8nLCB7Zm9ybWF0OiBcImpzb25cIn0sIGZ1bmN0aW9uKHZpbWVvdmlkZW8pIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codmltZW92aWRlb1swXS50aHVtYm5haWxfc21hbGwucmVwbGFjZShcImh0dHBzOi8vaS52aW1lb2Nkbi5jb20vdmlkZW8vXCIsXCJcIikucmVwbGFjZShcIl8xMDB4NzUuanBnXCIsXCJcIikpXHJcbiAgICAgICAgICAgICQoJy5wcm9kdWN0X19nYWxsZXJ5LS10aHVtYnMnKS5zbGljaygnc2xpY2tBZGQnLCAnPGRpdj48ZGl2IGNsYXNzPVxcJ3Byb2R1Y3RfX2dhbGxlcnktLXRodW1icy10aHVtYiBwcm9kdWN0X19nYWxsZXJ5LS10aHVtYnMtdmlkZW9cXCc+PGltZyBzcmM9XFwnJyArIHZpbWVvdmlkZW9bMF0udGh1bWJuYWlsX3NtYWxsICsgJ1xcJyBhbHQ9XFwnVmVqYSBvIFZpZGVvXFwnLz48L2Rpdj48L2Rpdj4nLDApO1xyXG4gICAgICAgICAgICAkKCcucHJvZHVjdF9fZ2FsbGVyeS0tcGljdHVyZXMnKS5zbGljaygnc2xpY2tBZGQnLCAnPGRpdj48ZGl2PjxkaXYgY2xhc3M9XFwncHJvZHVjdF9fZ2FsbGVyeS0tcGljdHVyZXMtLWl0ZW1cXCc+JyArIHZpZGVvVGVtcGxhdGUgKyAnPC9kaXY+PC9kaXY+PC9kaXY+JywwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvLyBnZXQgc2t1IGRhdGFcclxuICBnZXRTS1VEYXRhOiBmdW5jdGlvbihza3UpIHtcclxuICAgIHJldHVybiAkLmFqYXgoe1xyXG4gICAgICB1cmw6ICcvcHJvZHV0by9za3UvJyArIHNrdSxcclxuICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgIGRhdGFUeXBlOiAnSlNPTicsXHJcbiAgICAgIGFzeW5jOiB0cnVlXHJcbiAgICB9KS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvLyBiaW5kXHJcbiAgYmluZDogZnVuY3Rpb24oKSB7fSxcclxuXHJcbiAgLy8gY29sb3IgaW5wdXQgaW1hZ2UgY29sb3JcclxuICBjb2xvcnNUcmFuc2Zvcm06IGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgaXRlbXMgPSAkKCcucHJvZHVjdF9faW5mby0tcHJpY2UgLkNvciAuc2t1TGlzdCBpbnB1dCcpXHJcblxyXG4gICAgaXRlbXMuZWFjaCgoaW5kZXgsIGVsZW1lbnQpID0+IHtcclxuICAgICAgY29uc3QgaW5wdXQgPSAkKGVsZW1lbnQpXHJcbiAgICAgIGNvbnN0IGxhYmVsID0gaW5wdXQubmV4dCgpXHJcblxyXG4gICAgICBpZiAoaW5wdXQubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnN0IHRleHQgPSBpbnB1dC52YWwoKS5yZXBsYWNlKC8oXFxzKShcXCgpKFswLTldKikoXFwpKS9naSwgJycpXHJcblxyXG4gICAgICAgIGlmIChsYWJlbC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICBjb25zdCBjb2xvciA9IHRleHQucmVwbGFjZSgvXFxzKy9nLCAnLScpLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgIGxhYmVsLmVtcHR5KClcclxuICAgICAgICAgIGxhYmVsLnRleHQoJycpXHJcbiAgICAgICAgICBsYWJlbC5wcmVwZW5kKGA8aW1nIGNsYXNzPVwiYWN0aXZlXCIgc3JjPVwiL2FycXVpdm9zL2NvbG9yLSR7Y29sb3J9LnBuZ1wiIG9uRXJyb3I9XCJ0aGlzLmNsYXNzTmFtZT0nJ1wiIGFsdD1cIiR7Y29sb3J9XCIgLz5gKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLy8gZGVzY3JpcHRpb24gdGFic1xyXG4gIGRlc2NyaXB0aW9uVGFiczogZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9ICQoJy5wcm9kdWN0X19pbmZvLS1kZXNjcmlwdGlvbiAudGl0bGUnKVxyXG4gICAgY29uc3QgdGFiID0gJCgnLnByb2R1Y3RfX2luZm8tLXNwZWNpZmljYXRpb24gLm5hbWUtZmllbGQnKVxyXG5cclxuICAgIGRlc2NyaXB0aW9uLm9uKCdjbGljaycsIGUgPT4gdGhpcy5kZXNjcmlwdGlvblRhYnNPcGVuKGUpKTtcclxuICAgIHRhYi5vbignY2xpY2snLCBlID0+IHRoaXMuZGVzY3JpcHRpb25UYWJzT3BlbihlKSk7XHJcbiAgfSxcclxuXHJcbiAgLy8gZGVzY3JpcHRpb24gdGFicyBvcGVuXHJcbiAgZGVzY3JpcHRpb25UYWJzT3BlbjogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIGNvbnN0IHBhcmVudCA9ICQoZXZlbnQuY3VycmVudFRhcmdldCkucGFyZW50KClcclxuXHJcbiAgICBpZiAocGFyZW50Lmxlbmd0aCA+IDApIHtcclxuICAgICAgcGFyZW50LnRvZ2dsZUNsYXNzKCdhY3RpdmUnKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIGRlc2NyaXB0aW9uIHByb2R1Y3RcclxuICBkZXNjcmlwdGlvblByb2R1Y3RUZXh0OiBmdW5jdGlvbigpIHtcclxuICAgIGNvbnN0IHBhcmVudCA9ICQoJy5wcm9kdWN0X19pbmZvLS1kZXNjcmlwdGlvbicpXHJcbiAgICBjb25zdCB0aXRsZSA9ICQoYDxoNCBjbGFzcz1cInRpdGxlXCI+RGVzY3Jpw6fDo28gZG8gcHJvZHV0bzwvaDQ+YClcclxuXHJcbiAgICBwYXJlbnQucHJlcGVuZCh0aXRsZSlcclxuICB9LFxyXG5cclxuICAvLyBzaGFyZWRcclxuICBzaGFyZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgcGFyZW50ID0gJCgnLnByb2R1Y3RfX2luZm8tLXNoYXJlJylcclxuXHJcbiAgICBjb25zdCBsaW5rVyA9ICQoYDxhIGNsYXNzPVwibGlua1wiIGhyZWY9XCJodHRwczovL2FwaS53aGF0c2FwcC5jb20vc2VuZD9waG9uZT01NTExOTY2NDI5MzQzJnRleHQ9JHtlbmNvZGVVUklDb21wb25lbnQoZG9jdW1lbnQudGl0bGUpICsgJyAtICcrIGVuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24uaHJlZil9XCI+XHJcbiAgICAgICAgICAgIDxpbWcgc3JjPVwiL2FycXVpdm9zL3doYXRzYXBwLnN2Z1wiIGFsdD1cIkZhY2Vib29rXCI+XHJcbiAgICAgICAgPC9hPmApXHJcblxyXG4gICAgY29uc3QgbGlua0YgPSAkKGA8YSBjbGFzcz1cImxpbmtcIiBocmVmPVwiaHR0cDovL3d3dy5mYWNlYm9vay5jb20vc2hhcmVyL3NoYXJlci5waHA/dT0ke2VuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24uaHJlZil9XCI+XHJcbiAgICAgICAgICAgIDxpbWcgc3JjPVwiL2FycXVpdm9zL2ZhY2Vib29rLnN2Z1wiIGFsdD1cIldoYXRzYXBwXCI+XHJcbiAgICAgICAgPC9hPmApXHJcblxyXG4gICAgY29uc3QgbGlua1AgPSAkKGA8YSBjbGFzcz1cImxpbmtcIiBocmVmPVwiaHR0cDovL3BpbnRlcmVzdC5jb20vcGluL2NyZWF0ZS9idXR0b24vP3VybD0ke2VuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24uaHJlZil9XCI+XHJcbiAgICAgICAgICAgIDxpbWcgc3JjPVwiL2FycXVpdm9zL3BpbnRlcmVzdC1zb2NpYWwtbG9nby5zdmdcIiBhbHQ9XCJGYWNlYm9va1wiPlxyXG4gICAgICAgIDwvYT5gKVxyXG4gICAgLy8gY29uc3QgbGlua1cgPSAkKGA8YSBjbGFzcz1cImxpbmtcIiBocmVmPVwiaHR0cHM6Ly9hcGkud2hhdHNhcHAuY29tL3NlbmQ/dGV4dD0ke2VuY29kZVVSSUNvbXBvbmVudChkb2N1bWVudC50aXRsZSkgKyAnIC0gJysgZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbi5ocmVmKX1cIj5cclxuICAgIC8vICAgICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tc2hhcmVkLXdcIj48L3NwYW4+XHJcbiAgICAvLyAgICAgPC9hPmApXHJcbiAgICAvL1xyXG4gICAgLy8gY29uc3QgbGlua0YgPSAkKGA8YSBjbGFzcz1cImxpbmtcIiBocmVmPVwiaHR0cDovL3d3dy5mYWNlYm9vay5jb20vc2hhcmVyL3NoYXJlci5waHA/dT0ke2VuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24uaHJlZil9XCI+XHJcbiAgICAvLyAgICAgICAgIDxzcGFuIGNsYXNzPVwiaWNvbiBpY29uLXNoYXJlZC1mXCI+PC9zcGFuPlxyXG4gICAgLy8gICAgIDwvYT5gKVxyXG4gICAgLy9cclxuICAgIC8vIGNvbnN0IGxpbmtQID0gJChgPGEgY2xhc3M9XCJsaW5rXCIgaHJlZj1cImh0dHA6Ly9waW50ZXJlc3QuY29tL3Bpbi9jcmVhdGUvYnV0dG9uLz91cmw9JHtlbmNvZGVVUklDb21wb25lbnQod2luZG93LmxvY2F0aW9uLmhyZWYpfVwiPlxyXG4gICAgLy8gICAgICAgICA8c3BhbiBjbGFzcz1cImljb24gaWNvbi1zaGFyZWQtcFwiPjwvc3Bhbj5cclxuICAgIC8vICAgICA8L2E+YClcclxuXHJcbiAgICBwYXJlbnQuYXBwZW5kKGxpbmtXKVxyXG4gICAgcGFyZW50LmFwcGVuZChsaW5rRilcclxuICAgIHBhcmVudC5hcHBlbmQobGlua1ApXHJcblxyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5wcm9kdWN0X19pbmZvLS1zaGFyZSAubGluaycsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgd2luZG93Lm9wZW4odGhpcy5ocmVmLCBcInBvcFVwV2luZG93XCIsIFwiaGVpZ2h0PTUwMCx3aWR0aD01MDBcIiksXHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICBzY3JvbGxCdXR0b21GdW5jdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgc2Nyb2xsVG9wQnV0dG9tID0gJCgnLnByb2R1Y3RfX2luZm8tLWJ1eScpO1xyXG4gIFxyXG4gICAgJCh3aW5kb3cpLnNjcm9sbChmdW5jdGlvbigpIHtcclxuICAgICAgaWYoJCh3aW5kb3cpLnNjcm9sbFRvcCgpID4gc2Nyb2xsVG9wQnV0dG9tLnBvc2l0aW9uKCkudG9wIC0gMTQwKSB7XHJcbiAgICAgICAgICBzY3JvbGxUb3BCdXR0b20uYWRkQ2xhc3MoJ3ByZXYtYnV0dG9tLWZsb2F0Jyk7XHJcbiAgICAgIH0gXHJcbiAgICAgIGlmICgkKHdpbmRvdykuc2Nyb2xsVG9wKCkgPiBzY3JvbGxUb3BCdXR0b21bMF0ub2Zmc2V0VG9wIC0gNTApIHtcclxuICAgICAgICAgIHNjcm9sbFRvcEJ1dHRvbS5hZGRDbGFzcygnYnV0dG9tLWZsb2F0Jyk7XHJcbiAgICAgIH0gXHJcbiAgICAgIGlmICgkKHdpbmRvdykuc2Nyb2xsVG9wKCkgPCBzY3JvbGxUb3BCdXR0b21bMF0ub2Zmc2V0VG9wIC0gNTApIHtcclxuICAgICAgICAgIHNjcm9sbFRvcEJ1dHRvbS5yZW1vdmVDbGFzcygnYnV0dG9tLWZsb2F0Jyk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCQod2luZG93KS5zY3JvbGxUb3AoKSA8IHNjcm9sbFRvcEJ1dHRvbVswXS5vZmZzZXRUb3AgLSAxNDApIHtcclxuICAgICAgICAgIHNjcm9sbFRvcEJ1dHRvbS5yZW1vdmVDbGFzcygncHJldi1idXR0b20tZmxvYXQnKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG59KTtcclxuIiwiQVBQLmNvbnRyb2xsZXIuU2VhcmNoUGFnZUVtcHR5ID0gVnRleENsYXNzLmV4dGVuZCh7XHJcbiAgLy8gaW5pdFxyXG4gIGluaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc3RhcnQoKVxyXG4gICAgdGhpcy5iaW5kKClcclxuICB9LFxyXG5cclxuICAvLyBzdGFydFxyXG4gIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmVsZW1lbnQgPSAkKCcuYW1pc3NpbWEtc2VhcmNoLS1mb3JtJyk7XHJcbiAgICB0aGlzLnZhbHVlID0gJyc7XHJcblxyXG4gICAgaWYgKHRoaXMuZWxlbWVudCBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICB0aGlzLmZvcm0oKVxyXG4gICAgICB0aGlzLnRlcm1TZWFyY2goKVxyXG5cclxuICAgICAgJCgnLmFtaXNzaW1hLS1zaGVsZicpLmVhY2goKGluZGV4LCBlbGVtZW50KSA9PiB7XHJcbiAgICAgICAgY29uc3QgaXRlbSA9ICQoZWxlbWVudClcclxuXHJcbiAgICAgICAgaWYgKGl0ZW0ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgbmV3IEFQUC5jb21wb25lbnQuU2hlbGYoKVxyXG5cclxuICAgICAgICAgIGl0ZW0uZmluZCgnPiB1bCcpLnNsaWNrKHtcclxuICAgICAgICAgICAgYXJyb3dzOiB0cnVlLFxyXG4gICAgICAgICAgICBpbmZpbml0ZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogNCxcclxuICAgICAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDEsXHJcbiAgICAgICAgICAgICAgcmVzcG9uc2l2ZTogW1xyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrcG9pbnQ6IDk5OTksXHJcbiAgICAgICAgICAgICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVzVG9TaG93OiA0LFxyXG4gICAgICAgICAgICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxLFxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgIGJyZWFrcG9pbnQ6IDEwMjQsXHJcbiAgICAgICAgICAgICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVzVG9TaG93OiAyLFxyXG4gICAgICAgICAgICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxLFxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIF1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBiaW5kXHJcbiAgYmluZDogZnVuY3Rpb24gKCkge1xyXG4gIH0sXHJcblxyXG4gIC8vIGZvcm1cclxuICBmb3JtOiBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBmb3JtID0gdGhpcy5lbGVtZW50LmZpbmQoJ2Zvcm0nKVxyXG5cclxuICAgIHRoaXMub25JbnB1dChmb3JtKVxyXG4gICAgdGhpcy5vblN1Ym1pdChmb3JtKVxyXG4gIH0sXHJcblxyXG4gIC8vIGdldCBzZWFyY2ggcGFyYW1zXHJcbiAgZ2V0U2VhcmNoUGFyYW1zOiBmdW5jdGlvbiAoaykge1xyXG4gICAgbGV0IHAgPSB7fVxyXG4gICAgbG9jYXRpb24uc2VhcmNoLnJlcGxhY2UoL1s/Jl0rKFtePSZdKyk9KFteJl0qKS9naSwocywgaywgdikgPT4gcFtrXSA9IHYpXHJcblxyXG4gICAgcmV0dXJuIGsgPyBwW2tdIDogcFxyXG4gIH0sXHJcblxyXG4gIC8vIG9uIGlucHV0XHJcbiAgb25JbnB1dDogZnVuY3Rpb24gKGZvcm0pIHtcclxuICAgIGlmIChmb3JtIGluc3RhbmNlb2YgT2JqZWN0ID09PSBmYWxzZSkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIGNvbnN0IGlucHV0ID0gZm9ybS5maW5kKCdpbnB1dFt0eXBlPVwidGV4dFwiXScpXHJcblxyXG4gICAgaW5wdXQub24oJ2tleXVwJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgIGlmIChldmVudCBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgIHRoaXMudmFsdWUgPSBldmVudC50YXJnZXQudmFsdWVcclxuICAgICAgICBmb3JtLmF0dHIoJ2FjdGlvbicsICcvYnVzY2EvP2Z0PScpXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIC8vIG9uIHN1Ym1pdFxyXG4gIG9uU3VibWl0OiBmdW5jdGlvbiAoZm9ybSkge1xyXG4gICAgaWYgKGZvcm0gaW5zdGFuY2VvZiBPYmplY3QgPT09IGZhbHNlKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgY29uc3QgYnV0dG9uID0gZm9ybS5maW5kKCdmb3JtJyk7XHJcblxyXG4gICAgaWYgKGJ1dHRvbiBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICBidXR0b24ub24oJ2NsaWNrJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgIT09ICcnKSB7XHJcbiAgICAgICAgICBmb3JtLnN1Ym1pdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gdGVybVxyXG4gIHRlcm1TZWFyY2g6IGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IHRlcm0gPSB0aGlzLmdldFNlYXJjaFBhcmFtcygnZnQnKTtcclxuICAgIGNvbnN0IHRleHQgPSB0aGlzLmVsZW1lbnQuZmluZCgnLnRpdGxlIC50ZXJtJyk7XHJcblxyXG4gICAgaWYgKHRleHQgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgdGV4dC50ZXh0KHRlcm0pO1xyXG4gICAgfVxyXG4gIH0sXHJcbn0pXHJcbiIsIkFQUC5jb250cm9sbGVyLlNlYXJjaFBhZ2UgPSBWdGV4Q2xhc3MuZXh0ZW5kKHtcclxuICAvLyBpbml0XHJcbiAgaW5pdDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnNldHVwKClcclxuICAgIHRoaXMuc3RhcnQoKVxyXG4gICAgdGhpcy5iaW5kKClcclxuICB9LFxyXG5cclxuICAvLyBzZXR1cFxyXG4gIHNldHVwOiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuZWxlbWVudCA9ICQoJy5zZWFyY2gnKVxyXG4gICAgdGhpcy5yZXN1bHRJdGVtcyA9ICQoJy5yZXN1bHRJdGVtc1dyYXBwZXIgZGl2W2lkXj1cIlJlc3VsdEl0ZW1zXCJdJylcclxuICAgIHRoaXMub3JkZXIgPSAkKCcuc2VhcmNoLW9yZGVyJylcclxuXHJcbiAgICBuZXcgQVBQLmNvbXBvbmVudC5TZWxlY3Qoe1xyXG4gICAgICBzZWxlY3RvcjogJy5hbWlzc2ltYS1zZWxlY3QnLFxyXG4gICAgICBjYWxsYmFjazogdGhpcy5tb2JpbGVDaGVja0ZpbHRlci5iaW5kKHRoaXMpXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMudGl0bGUodGhpcy5lbGVtZW50LmZpbmQoJy5hbWlzc2ltYS1zZWFyY2gtLXRlcm0nKSlcclxuICB9LFxyXG5cclxuICAvLyBoaWRlIHJlc3VsdFxyXG4gIF9oaWRlUmVzdWx0OiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMucmVzdWx0SXRlbXNcclxuICAgICAgLmZpbmQoJy5hbWlzc2ltYS0tc2hlbGYgPiB1bCcpXHJcbiAgICAgIC5zdG9wKHRydWUsIHRydWUpXHJcbiAgICAgIC5zbGlkZVVwKCdzbG93JylcclxuICB9LFxyXG5cclxuICAvLyBzaG93IHJlc3VsdFxyXG4gIF9zaG93UmVzdWx0OiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMucmVzdWx0SXRlbXNcclxuICAgICAgLmZpbmQoJy5hbWlzc2ltYS0tc2hlbGYgPiB1bCcpXHJcbiAgICAgIC5zdG9wKHRydWUsIHRydWUpXHJcbiAgICAgIC5zbGlkZURvd24oJ3Nsb3cnKVxyXG4gIH0sXHJcblxyXG4gIC8vIHNjcm9sbCB0b3BcclxuICBfc2Nyb2xsVG9Ub3BSZXN1bHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgJCgnaHRtbCwgYm9keScpXHJcbiAgICAgIC5zdG9wKClcclxuICAgICAgLmFuaW1hdGUoe1xyXG4gICAgICAgIHNjcm9sbFRvcDogMFxyXG4gICAgICB9LCA1MDApO1xyXG4gIH0sXHJcblxyXG5cclxuICAvLyBzdGFydFxyXG4gIHN0YXJ0OiBmdW5jdGlvbigpIHtcclxuICAgIG5ldyBBUFAuY29tcG9uZW50LlNoZWxmKCQoJCgnLmFtaXNzaW1hLS1zaGVsZicpWzBdKSlcclxuXHJcbiAgICB0aGlzLnJlc3VsdEl0ZW1zXHJcbiAgICAgIC52dGV4U2VhcmNoKHtcclxuICAgICAgICAkc2VsZWN0T3JkZXI6IHRoaXMub3JkZXIsXHJcbiAgICAgICAgcGFnaW5hdGlvbjogdHJ1ZVxyXG4gICAgICB9KVxyXG4gICAgICAub24oJ3Z0ZXhzZWFyY2guYmVmb3JlRmlsdGVyIHZ0ZXhzZWFyY2guYmVmb3JlQ2hhbmdlT3JkZXIgdnRleHNlYXJjaC5iZWZvcmVDaGFuZ2VQYWdlJywgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuX2hpZGVSZXN1bHQoKVxyXG4gICAgICAgIHRoaXMuX3Njcm9sbFRvVG9wUmVzdWx0KClcclxuICAgICAgfSlcclxuICAgICAgLm9uKCd2dGV4c2VhcmNoLmFmdGVyRmlsdGVyIHZ0ZXhzZWFyY2guYWZ0ZXJDaGFuZ2VPcmRlciB2dGV4c2VhcmNoLmFmdGVyQ2hhbmdlUGFnZScsICgpID0+IHtcclxuICAgICAgICB0aGlzLl9zaG93UmVzdWx0KClcclxuICAgICAgfSlcclxuICAgICAgLm9uKCd2dGV4c2VhcmNoLmFmdGVyU2VhcmNoJywgKCkgPT4ge30pXHJcblxyXG4gICAgaWYgKCQoJy5zZWFyY2gtbXVsdGlwbGUtbmF2aWdhdG9yJykubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHRoaXMubWFrZUZha2VNdWx0aXBsZU5hdmlnYXRvcigpXHJcbiAgICAgIHRoaXMuZmlsdGVyU3ViQ2F0ZWdvcmllcygpXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5maWx0ZXJzKClcclxuXHJcblxyXG4gIH0sXHJcblxyXG4gIC8vIGJpbmRcclxuICBiaW5kOiBmdW5jdGlvbigpIHt9LFxyXG5cclxuICAvLyBnZXQgc2VhcmNoIHBhcmFtc1xyXG4gIGdldFNlYXJjaFBhcmFtczogZnVuY3Rpb24oaykge1xyXG4gICAgbGV0IHAgPSB7fVxyXG4gICAgbG9jYXRpb24uc2VhcmNoLnJlcGxhY2UoL1s/Jl0rKFtePSZdKyk9KFteJl0qKS9naSwgKHMsIGssIHYpID0+IHBba10gPSB2KVxyXG5cclxuICAgIGNvbnN0IHRlcm0gPSBrID8gcFtrXSA6IHBcclxuXHJcbiAgICBpZiAoIXRlcm0pIHtcclxuICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnLycpLnBvcCgpXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRlcm1cclxuICB9LFxyXG5cclxuICAvLyBtb2JpbGUgY2hlY2sgZmlsdGVyXHJcbiAgbW9iaWxlQ2hlY2tGaWx0ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKCQod2luZG93KS53aWR0aCgpIDw9IDEwMjQpIHtcclxuICAgICAgJCgnLmFtaXNzaW1hLWNhdGFsb2ctLWZpbHRlcnMnKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyB0aXRsZVxyXG4gIHRpdGxlOiBmdW5jdGlvbihwYXJlbnQpIHtcclxuICAgIGlmIChwYXJlbnQgaW5zdGFuY2VvZiBPYmplY3QgPT09IGZhbHNlKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0ZXJtID0gdGhpcy5nZXRTZWFyY2hQYXJhbXMoJ3Rlcm0nKVxyXG4gICAgY29uc3QgdG90YWwgPSB0aGlzLmVsZW1lbnQuZmluZCgnLnNlYXJjaFJlc3VsdHNUaW1lIC5yZXN1bHRhZG8tYnVzY2EtbnVtZXJvOmZpcnN0LWNoaWxkIC52YWx1ZScpWzBdXHJcblxyXG4gICAgY29uc3QgdGVybVRleHQgPSBwYXJlbnQuZmluZCgnLmluZm8gLnRleHQtc2VhcmNoIC50ZXJtJylcclxuICAgIGNvbnN0IHRvdGFsVGV4dCA9IHBhcmVudC5maW5kKCcuaW5mbyAudGV4dDpmaXJzdC1jaGlsZCAudGVybScpXHJcblxyXG4gICAgdGhpcy50aXRsZVRlcm0odGVybSwgdGVybVRleHQpXHJcbiAgICB0aGlzLnRpdGxlVGVybShwYXJzZUludCh0b3RhbC5pbm5lclRleHQpLCB0b3RhbFRleHQpXHJcblxyXG4gICAgaWYgKHRlcm1UZXh0IGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgIHRlcm1UZXh0LnRleHQodGVybSlcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyB0ZXJtXHJcbiAgdGl0bGVUZXJtOiBmdW5jdGlvbih2YWx1ZSwgZWxlbWVudCkge1xyXG4gICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgY29uc29sZS5sb2coJ3ZhbHVlJywgdmFsdWUpO1xyXG4gICAgICBlbGVtZW50LnRleHQodmFsdWUpXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgZmlsdGVyU3ViQ2F0ZWdvcmllczogZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zdCBwYXJlbnQgPSAkKCcuY2F0YWxvZyAuYW1pc3NpbWEtY2F0YWxvZy0tZmlsdGVycyAuc2VhcmNoLW11bHRpcGxlLW5hdmlnYXRvcicpXHJcbiAgICBjb25zdCBtZW51ID0gJCgnLmNhdGFsb2cgLmFtaXNzaW1hLWNhdGFsb2ctLWZpbHRlcnMgLnNlYXJjaC1zaW5nbGUtbmF2aWdhdG9yJylcclxuICAgIGNvbnN0IGJ1dHRvbiA9ICQoJzxoNSBjbGFzcz1cImV2ZW5cIj5TdWIgQ2F0ZWdvcmlhczwvaDU+JylcclxuXHJcbiAgICBjb25zb2xlLmxvZyhtZW51KVxyXG5cclxuICAgIGNvbnN0IGZpbHRlciA9ICQoJzxmaWVsZHNldCBjbGFzcz1cInJlZmlub1wiPjwvZmllbGRzZXQ+JylcclxuICAgIGZpbHRlci5wcmVwZW5kKGJ1dHRvbilcclxuXHJcbiAgICBpZiAobWVudS5sZW5ndGgpIHtcclxuICAgICAgZmlsdGVyLmFwcGVuZChtZW51KVxyXG5cclxuICAgICAgaWYgKHBhcmVudC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgcGFyZW50LnByZXBlbmQoZmlsdGVyKVxyXG4gICAgICAgIHRoaXMuZmlsdGVyU3ViQ2F0ZWdvcmllc1JlZmFjdG9yeShtZW51LCBmaWx0ZXIpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBmaWx0ZXJTdWJDYXRlZ29yaWVzUmVmYWN0b3J5OiBmdW5jdGlvbihlbGVtZW50LCBwYXJlbnQpIHtcclxuICAgIGlmIChwYXJlbnQubGVuZ3RoID4gMCAmJiBlbGVtZW50Lmxlbmd0aCA+IDApIHtcclxuICAgICAgY29uc3QgY29udGFpbmVyID0gJCgnPGRpdiBjbGFzcz1cImdyb3Vwc1wiPjwvZGl2PicpXHJcbiAgICAgIHBhcmVudC5hcHBlbmQoY29udGFpbmVyKVxyXG5cclxuICAgICAgaWYgKGNvbnRhaW5lci5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdGhpcy5maWx0ZXJTdWJDYXRlZ29yaWVzUmVmYWN0b3J5R3JvdXAoZWxlbWVudCwgY29udGFpbmVyKVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmYWxzZVxyXG4gIH0sXHJcblxyXG4gIGZpbHRlclN1YkNhdGVnb3JpZXNSZWZhY3RvcnlHcm91cDogZnVuY3Rpb24oZWxlbWVudCwgY29udGFpbmVyKSB7XHJcbiAgICBlbGVtZW50LmZpbmQoJy5IaWRlLCAuSGlkZSArIHVsJykucmVtb3ZlKClcclxuXHJcbiAgICBlbGVtZW50LmZpbmQoJ2gzLCBoNCcpLmVhY2goKGluZGV4LCBlbGVtKSA9PiB7XHJcbiAgICAgIGNvbnN0IGl0ZW0gPSAkKGVsZW0pXHJcbiAgICAgIGNvbnN0IGxpc3QgPSBpdGVtLm5leHQoKVxyXG4gICAgICBjb25zdCBncm91cCA9ICQoJzxkaXYgY2xhc3M9XCJncm91cFwiPjwvZGl2PicpXHJcblxyXG4gICAgICBncm91cC5hcHBlbmQoaXRlbSlcclxuICAgICAgZ3JvdXAuYXBwZW5kKGxpc3QpXHJcblxyXG4gICAgICBpZiAoY29udGFpbmVyLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGNvbnRhaW5lci5hcHBlbmQoZ3JvdXApLCAxMDAwKVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICBtYWtlRmFrZU11bHRpcGxlTmF2aWdhdG9yOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICQoJzxkaXYgY2xhc3M9XCJzZWFyY2gtbXVsdGlwbGUtbmF2aWdhdG9yXCI+PC9kaXY+JykuaW5zZXJ0QmVmb3JlKCcuc2VhcmNoLXNpbmdsZS1uYXZpZ2F0b3InKVxyXG5cclxuXHJcbiAgfSxcclxuXHJcbiAgLy8gZmlsdGVyc1xyXG4gIGZpbHRlcnM6IGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgZmlsdGVycyA9IHRoaXMuZWxlbWVudC5maW5kKCcuYW1pc3NpbWEtY2F0YWxvZy0tZmlsdGVycycpO1xyXG5cclxuICAgIGlmIChmaWx0ZXJzLmxlbmd0aCA+IDApIHtcclxuICAgICAgY29uc3QgaXRlbXMgPSBmaWx0ZXJzLmZpbmQoJy5zZWFyY2gtbXVsdGlwbGUtbmF2aWdhdG9yIGZpZWxkc2V0LnJlZmlubycpO1xyXG5cclxuICAgICAgJC5lYWNoKGl0ZW1zLCAoaW5kZXgsIGVsZW1lbnQpID0+IHtcclxuICAgICAgICBjb25zdCBpdGVtID0gJChlbGVtZW50KTtcclxuICAgICAgICBjb25zdCBidG4gPSBpdGVtLmZpbmQoJ2g1JylcclxuICAgICAgICBjb25zdCBjbGFzc05hbWUgPSBidG4udGV4dCgpLnJlcGxhY2UoL1teYS16QS1aIF0vZywgXCJcIilcclxuXHJcbiAgICAgICAgaWYgKGJ0bi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICB0aGlzLmZpbHRlckFjdGl2ZShidG4sIGl0ZW1zKVxyXG4gICAgICAgICAgdGhpcy5maWx0ZXJUeXBlKGl0ZW0sIGNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICB0aGlzLmZpbHRlck1vYmlsZShmaWx0ZXJzKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIGZpbHRlciBhZGQgdGV4dFxyXG4gIGZpbHRlckFkZFRleHQ6IGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgIGlmIChpdGVtIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9ICQoJzxkaXYgY2xhc3M9XCJjb250YWluZXJcIj48L2Rpdj4nKVxyXG5cclxuICAgICAgY29udGFpbmVyLmFwcGVuZChgPHAgY2xhc3M9XCJ0aXRsZVwiPiR7aXRlbS5maW5kKCdoNScpLnRleHQoKX08L3A+YClcclxuICAgICAgY29udGFpbmVyLmFwcGVuZChpdGVtLmZpbmQoJ2RpdicpKVxyXG5cclxuICAgICAgaXRlbS5hcHBlbmQoY29udGFpbmVyKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIGZpbHRlciBhY3RpdmUgXCJidXR0b25cIlxyXG4gIGZpbHRlckFjdGl2ZTogZnVuY3Rpb24oYnRuLCBpdGVtcykge1xyXG4gICAgaWYgKGJ0biBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICBidG4ub24oJ2NsaWNrJywgZXZlbnQgPT4ge1xyXG4gICAgICAgIGNvbnN0IHBhcmVudCA9ICQoZXZlbnQudGFyZ2V0KS5wYXJlbnQoKTtcclxuXHJcbiAgICAgICAgaWYgKHBhcmVudC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAkLmVhY2goaXRlbXMsIChpbmRleCwgaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gJChpdGVtKVxyXG5cclxuICAgICAgICAgICAgaWYgKHBhcmVudFswXSAhPT0gaXRlbSkge1xyXG4gICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHBhcmVudC50b2dnbGVDbGFzcygnYWN0aXZlJylcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIGZpbHRlciBjbGVhclxyXG4gIGZpbHRlckNsZWFyVGV4dDogZnVuY3Rpb24oZWxlbWVudCwgdHlwZSwgY2xhc3NOYW1lKSB7XHJcbiAgICBjb25zdCBpdGVtID0gJChlbGVtZW50KVxyXG5cclxuICAgIGlmIChpdGVtKSB7XHJcbiAgICAgIGNvbnN0IGlucHV0ID0gaXRlbS5maW5kKCdpbnB1dCcpXHJcbiAgICAgIGNvbnN0IHRleHQgPSB0eXBlID09PSB0cnVlID8gaXRlbS50ZXh0KCkucmVwbGFjZSgvKFxccykoXFwoKShbMC05XSopKFxcKSkvZ2ksICcnKSA6IGl0ZW0udGV4dCgpXHJcbiAgICAgIGNvbnN0IHRleHRFbGVtZW50ID0gJChgPHNwYW4gY2xhc3M9XCJ0ZXh0XCI+JHt0ZXh0fTwvc3Bhbj5gKVxyXG5cclxuICAgICAgaXRlbS5lbXB0eSgpXHJcbiAgICAgIGl0ZW0uYXBwZW5kKGlucHV0KVxyXG4gICAgICBpdGVtLmFwcGVuZCh0ZXh0RWxlbWVudClcclxuXHJcbiAgICAgIGlmIChjbGFzc05hbWUgPT09ICdjb3InKSB7XHJcbiAgICAgICAgY29uc3QgY29sb3IgPSB0ZXh0LnJlcGxhY2UoL1xccysvZywgJy0nKS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgaXRlbS5wcmVwZW5kKGA8aW1nIGNsYXNzPVwiYWN0aXZlXCIgc3JjPVwiL2FycXVpdm9zL2NvbG9yLSR7Y29sb3J9LnBuZ1wiIG9uRXJyb3I9XCJ0aGlzLmNsYXNzTmFtZT0nJ1wiIGFsdD1cIiR7Y29sb3J9XCIgLz5gKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gZmlsdGVyIG1vYmlsZVxyXG4gIGZpbHRlck1vYmlsZTogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgaWYgKGVsZW1lbnQubGVuZ3RoID4gMCkge1xyXG4gICAgICBjb25zdCBidXR0b25Nb2JpbGUgPSAkKGA8YnV0dG9uIGNsYXNzPVwiYnRuLWZpbHRlci1vcGVuXCI+XHJcbiAgICAgICAgZmlsdHJhcjxzcGFuIGNsYXNzPVwiaWNvbiBpY29uLWZpbHRlclwiPjwvc3Bhbj5cclxuICAgICAgPC9idXR0b24+YClcclxuXHJcbiAgICAgIGJ1dHRvbk1vYmlsZS5vbignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgYnV0dG9uTW9iaWxlLnBhcmVudCgpLnRvZ2dsZUNsYXNzKGUgPT4ge1xyXG4gICAgICAgICAgaWYgKGUgPT09IDApIHtcclxuICAgICAgICAgICAgdGhpcy5maWx0ZXJNb2JpbGVBY3RpdmUoKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4gJ2FjdGl2ZSdcclxuICAgICAgICB9KVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGVsZW1lbnQuYXBwZW5kKGJ1dHRvbk1vYmlsZSlcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBmaWx0ZXIgbW9iaWxlIGFjdGl2ZVxyXG4gIGZpbHRlck1vYmlsZUFjdGl2ZTogZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zdCBwYXJlbnQgPSAkKCcucmVmaW5vLmNvcicpXHJcblxyXG4gICAgaWYgKHBhcmVudC5maW5kKCcuY29udGFpbmVyIC5idG4tbW9yZScpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBjb25zdCBidG5Nb3JlID0gJChgPGJ1dHRvbiBjbGFzcz1cImJ0bi1tb3JlXCI+XHJcbiAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0XCI+VmVyIG1haXM8L3NwYW4+XHJcbiAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0XCI+VmVyIG1lbm9zPC9zcGFuPlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPVwiaWNvbiBpY29uLWFycm93LWRvd25cIj48L3NwYW4+XHJcbiAgICAgIDwvYnV0dG9uPmApXHJcblxyXG4gICAgICBidG5Nb3JlLm9uKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICBwYXJlbnQudG9nZ2xlQ2xhc3MoJ21vcmUnKVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHBhcmVudC5maW5kKCcuY29udGFpbmVyJykuYXBwZW5kKGJ0bk1vcmUpXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuICdhY3RpdmUnXHJcbiAgfSxcclxuXHJcbiAgLy8gZmlsdGVyIHR5cGVcclxuICBmaWx0ZXJUeXBlOiBmdW5jdGlvbihpdGVtLCBjbGFzc05hbWUpIHtcclxuICAgIGlmIChpdGVtIGluc3RhbmNlb2YgT2JqZWN0ID09PSB0cnVlKSB7XHJcbiAgICAgIGl0ZW0uYWRkQ2xhc3MoY2xhc3NOYW1lKVxyXG5cclxuICAgICAgc3dpdGNoIChjbGFzc05hbWUpIHtcclxuICAgICAgICBjYXNlICd0ZW5kbmNpYXMnOlxyXG4gICAgICAgICAgJChpdGVtKS5maW5kKCdkaXYgPiBsYWJlbCcpLmVhY2goKGluZGV4LCBpdGVtKSA9PiB0aGlzLmZpbHRlckNsZWFyVGV4dChpdGVtLCBmYWxzZSkpXHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdjb3InOlxyXG4gICAgICAgICAgJChpdGVtKS5maW5kKCdkaXYgPiBsYWJlbCcpLmVhY2goKGluZGV4LCBpdGVtKSA9PiB0aGlzLmZpbHRlckNsZWFyVGV4dChpdGVtLCB0cnVlLCBjbGFzc05hbWUpKVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAndGFtYW5obyc6XHJcbiAgICAgICAgICAkKGl0ZW0pLmZpbmQoJ2RpdiA+IGxhYmVsJykuZWFjaCgoaW5kZXgsIGl0ZW0pID0+IHRoaXMuZmlsdGVyQ2xlYXJUZXh0KGl0ZW0sIHRydWUpKVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5maWx0ZXJBZGRUZXh0KGl0ZW0pXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcblxyXG4gIGZpbHRlclN1YkNhdGVnb3JpZXNSZWZhY3Rvcnk6IGZ1bmN0aW9uKGVsZW1lbnQsIHBhcmVudCkge1xyXG4gICAgaWYgKHBhcmVudC5sZW5ndGggPiAwICYmIGVsZW1lbnQubGVuZ3RoID4gMCkge1xyXG4gICAgICBjb25zdCBjb250YWluZXIgPSAkKCc8ZGl2IGNsYXNzPVwiZ3JvdXBzXCI+PC9kaXY+JylcclxuICAgICAgcGFyZW50LmFwcGVuZChjb250YWluZXIpXHJcblxyXG4gICAgICBpZiAoY29udGFpbmVyLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB0aGlzLmZpbHRlclN1YkNhdGVnb3JpZXNSZWZhY3RvcnlHcm91cChlbGVtZW50LCBjb250YWluZXIpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfSxcclxuXHJcbiAgZmlsdGVyU3ViQ2F0ZWdvcmllc1JlZmFjdG9yeUdyb3VwOiBmdW5jdGlvbihlbGVtZW50LCBjb250YWluZXIpIHtcclxuICAgIGVsZW1lbnQuZmluZCgnLkhpZGUsIC5IaWRlICsgdWwnKS5yZW1vdmUoKVxyXG5cclxuICAgIGVsZW1lbnQuZmluZCgnaDMsIGg0JykuZWFjaCgoaW5kZXgsIGVsZW0pID0+IHtcclxuICAgICAgY29uc3QgaXRlbSA9ICQoZWxlbSlcclxuICAgICAgY29uc3QgbGlzdCA9IGl0ZW0ubmV4dCgpXHJcbiAgICAgIGNvbnN0IGdyb3VwID0gJCgnPGRpdiBjbGFzcz1cImdyb3VwXCI+PC9kaXY+JylcclxuXHJcbiAgICAgIGdyb3VwLmFwcGVuZChpdGVtKVxyXG4gICAgICBncm91cC5hcHBlbmQobGlzdClcclxuXHJcbiAgICAgIGlmIChjb250YWluZXIubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gY29udGFpbmVyLmFwcGVuZChncm91cCksIDEwMDApXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufSk7XHJcbiIsIkFQUC5jb21wb25lbnQuU2VhcmNoID0gVnRleENsYXNzLmV4dGVuZCh7XHJcbiAgLy8gaW5pdFxyXG4gIGluaXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICB0aGlzLnNldHVwKG9wdGlvbnMpXHJcbiAgICB0aGlzLnN0YXJ0KClcclxuICAgIHRoaXMuYmluZCgpXHJcbiAgfSxcclxuXHJcbiAgLy8gc2V0dXBcclxuICBzZXR1cDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgZGVsYXk6IDMwMCxcclxuICAgICAgbWF4Um93czogMTIsXHJcbiAgICAgIG1vYmlsZUF1dG9Db21wbGV0ZTogZmFsc2UsXHJcbiAgICAgIHRodW1iU2l6ZTogNzgsXHJcblxyXG4gICAgICAkc2NvcGU6ICQoJy5oZWFkZXItYW1pc3NpbWEtLXNlYXJjaCcpLFxyXG4gICAgICAkaW5wdXQ6ICQoJy5oZWFkZXItYW1pc3NpbWEtLXNlYXJjaC0taW5wdXQnKSxcclxuICAgICAgJGJ1dHRvbjogJCgnLmhlYWRlci1hbWlzc2ltYS0tc2VhcmNoLS1zdWJtaXRbdHlwZT1cInN1Ym1pdFwiXScpLFxyXG4gICAgICAkbW9iSXNWaXNpYmxlOiAkKCcubWVudS1iYXInKSxcclxuXHJcbiAgICAgIGNsYXNzT3BlbjogJ2JvZHktaGVhZGVyX19zZWFyY2gtLW9wZW4nLFxyXG4gICAgICBjbGFzc1RhcmdldDogJ2hlYWRlci1hbWlzc2ltYS0tc2VhcmNoLS1jb250ZW50JyxcclxuICAgICAgY2xhc3NUYXJnZXRMaXN0OiAnaGVhZGVyLWFtaXNzaW1hLS1zZWFyY2gtLWxpc3QnLFxyXG4gICAgICBjbGFzc1RhcmdldExpc3RIZWFkOiAnaGVhZGVyLWFtaXNzaW1hLS1zZWFyY2gtLWxpc3QtaGVhZCcsXHJcbiAgICAgIGNsYXNzVGFyZ2V0TGlzdEl0ZW06ICdoZWFkZXItYW1pc3NpbWEtLXNlYXJjaC0taXRlbScsXHJcbiAgICAgIGNsYXNzVGFyZ2V0TGlzdEl0ZW1JbWFnZTogJ3Byb2R1Y3QnLFxyXG4gICAgICBjbGFzc1RhcmdldExpc3RJdGVtQ2F0ZWdvcnk6ICdjYXRlZ29yeScsXHJcbiAgICAgIGNsYXNzVGFyZ2V0TGlzdExpbms6ICdoZWFkZXItYW1pc3NpbWEtLXNlYXJjaC0tY29udGVudC0tbGluaydcclxuICAgIH0sIG9wdGlvbnMpXHJcbiAgfSxcclxuXHJcbiAgLy8gc3RhcnRcclxuICBzdGFydDogZnVuY3Rpb24gKCkge30sXHJcblxyXG4gIC8vIGJpbmRcclxuICBiaW5kOiBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmJpbmRDbGlja091dHNpZGUoKVxyXG4gICAgdGhpcy5iaW5kU2VhcmNoU3VibWl0KClcclxuICAgIHRoaXMuYmluZFNlYXJjaCgpXHJcbiAgICB0aGlzLmJpbmRGb2N1cygpXHJcbiAgICB0aGlzLmJpbmRDbG9zZSgpO1xyXG4gIH0sXHJcblxyXG4gIC8vIGJpbmQgY2xpY2sgb3V0IHNpZGVcclxuICBiaW5kQ2xpY2tPdXRzaWRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBldmVudCA9PiB7XHJcbiAgICAgIGNvbnN0ICRjbG9zZUJveCA9IHRoaXMub3B0aW9ucy4kc2NvcGVcclxuXHJcbiAgICAgIGlmICghJGNsb3NlQm94LmlzKGV2ZW50LnRhcmdldCkgJiYgJGNsb3NlQm94LmhhcyhldmVudC50YXJnZXQpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuY2xhc3NPcGVuKVxyXG5cclxuICAgICAgICB0aGlzLm9wdGlvbnMuJHNjb3BlLmZpbmQoYC4ke3RoaXMub3B0aW9ucy5jbGFzc1RhcmdldH1gKS5zaG93KClcclxuICAgICAgICAgIC5odG1sKCcnKVxyXG4gICAgICAgICAgLmhpZGUoKVxyXG4gICAgICAgICAgLmNzcyh7XHJcbiAgICAgICAgICAgIGhlaWdodDogJydcclxuICAgICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfSxcclxuXHJcbiAgLy8gY2xvc2Ugc2VhcmNoXHJcbiAgYmluZENsb3NlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBidXR0b25DbG9zZSA9IHRoaXMub3B0aW9ucy4kc2NvcGUuZmluZCgnLmhlYWRlci1hbWlzc2ltYS0tc2VhcmNoLS1zdWJtaXQ6bm90KFt0eXBlXSknKTtcclxuXHJcbiAgICBpZiAoYnV0dG9uQ2xvc2UgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgYnV0dG9uQ2xvc2Uub24oJ2NsaWNrJywgZXZlbnQgPT4ge1xyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgIGlmICgkKHdpbmRvdykud2lkdGgoKSA8PSAxMDI0KSB7XHJcbiAgICAgICAgICByZXR1cm4gJCgnLmhlYWRlci1hbWlzc2ltYScpLmF0dHIoJ2RhdGEtdHlwZScsICcnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuJHNjb3BlLmF0dHIoJ2RhdGEtYWN0aXZlJywgZmFsc2UpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBmb2N1cyBldmVudHNcclxuICBiaW5kRm9jdXM6IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgaWYgKHRoaXMub3B0aW9ucy4kaW5wdXQgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMuJGlucHV0LmZvY3VzKCgpID0+IHRoaXMuaW5wdXRPdXRJbkZvY3VzKHRydWUpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIGJpbmQgc2VhcmNoIHN1Ym1pdFxyXG4gIGJpbmRTZWFyY2hTdWJtaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMub3B0aW9ucy4kYnV0dG9uLm9uKCdjbGljaycsIGV2ZW50ID0+IHtcclxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxyXG5cclxuICAgICAgY29uc3QgdmFsID0gdGhpcy5vcHRpb25zLiRpbnB1dC52YWwoKVxyXG5cclxuICAgICAgaWYgKHZhbCAhPT0gJycpIHtcclxuICAgICAgICB0aGlzLnN1Ym1pdFNlYXJjaCh2YWwpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLiRpbnB1dC5mb2N1cygpXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfSxcclxuXHJcbiAgLy8gYmluZCBzZWFyY2hcclxuICBiaW5kU2VhcmNoOiBmdW5jdGlvbiAoKSB7XHJcbiAgICBsZXQgZGVsYXlcclxuXHJcbiAgICB0aGlzLm9wdGlvbnMuJGlucHV0Lm9uKCdrZXl1cCcsIGV2ZW50ID0+IHtcclxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxyXG5cclxuICAgICAgY29uc3QgX3RoaXMgPSAkKGV2ZW50LmN1cnJlbnRUYXJnZXQpXHJcbiAgICAgIGNvbnN0IHZhbCA9IF90aGlzLnZhbCgpXHJcbiAgICAgIGNvbnN0IGNvZGUgPSBldmVudC5rZXlDb2RlIHx8IGV2ZW50LndoaWNoXHJcblxyXG4gICAgICBpZiAoY29kZSA9PT0gMTMgJiYgdmFsICE9PSAnJykge1xyXG4gICAgICAgIHRoaXMuc3VibWl0U2VhcmNoKHZhbClcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWVcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuX2lzTW9iKCkgJiYgdGhpcy5vcHRpb25zLm1vYmlsZUF1dG9Db21wbGV0ZSA9PT0gZmFsc2UpIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjbGVhclRpbWVvdXQoZGVsYXkpXHJcblxyXG4gICAgICBkZWxheSA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIGlmICh2YWwgPT09ICcnKSB7XHJcbiAgICAgICAgICB0aGlzLm9wdGlvbnMuJHNjb3BlXHJcbiAgICAgICAgICAgIC5maW5kKGAuJHt0aGlzLm9wdGlvbnMuY2xhc3NUYXJnZXR9YClcclxuICAgICAgICAgICAgLmh0bWwoJycpXHJcbiAgICAgICAgICAgIC5oaWRlKClcclxuICAgICAgICAgICAgLmNzcygnaGVpZ2h0JywgJycpXHJcblxyXG4gICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmdldFNlYXJjaFJlc3VsdCh2YWwpXHJcbiAgICAgIH0sIHRoaXMub3B0aW9ucy5kZWxheSlcclxuICAgIH0pXHJcbiAgfSxcclxuXHJcbiAgLy8gZm9jdXMgZm9jdXNvdXRcclxuICBpbnB1dE91dEluRm9jdXM6IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy4kc2NvcGUgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgaWYgKCQod2luZG93KS53aWR0aCgpIDw9IDEwMjQpIHtcclxuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLm9wdGlvbnMuJHNjb3BlLnBhcmVudCgpLnBhcmVudCgpLnBhcmVudCgpO1xyXG5cclxuICAgICAgICBpZiAocGFyZW50LmF0dHIoJ2RhdGEtdHlwZScpICE9PSAnc2VhcmNoJykge1xyXG4gICAgICAgICAgcmV0dXJuIHBhcmVudC5hdHRyKCdkYXRhLXR5cGUnLCAnJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5vcHRpb25zLiRzY29wZS5hdHRyKCdkYXRhLWFjdGl2ZScsIHZhbHVlKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBzdWJtaXQgc2VhcmNoXHJcbiAgc3VibWl0U2VhcmNoOiBmdW5jdGlvbiAodGVybXMpIHtcclxuICAgIGNvbnN0IHVybFRlcm1zID0gZW5jb2RlVVJJKHRlcm1zLnRyaW0oKSlcclxuICAgIHdpbmRvdy5sb2NhdGlvbiA9IGAvJHt1cmxUZXJtc31gXHJcbiAgfSxcclxuXHJcbiAgLy8gZ2V0IHNlYXJjaCByZXN1bHRcclxuICBnZXRTZWFyY2hSZXN1bHQ6IGZ1bmN0aW9uICh0ZXJtcykge1xyXG4gICAgJC5hamF4KHtcclxuICAgICAgdXJsOiAnL2J1c2NhYXV0b2NvbXBsZXRlJyxcclxuICAgICAgdHlwZTogJ2dldCcsXHJcbiAgICAgIGRhdGE6IHtcclxuICAgICAgICBtYXhSb3dzOiB0aGlzLm9wdGlvbnMubWF4Um93cyxcclxuICAgICAgICBwcm9kdWN0TmFtZUNvbnRhaW5zOiB0ZXJtc1xyXG4gICAgICB9XHJcbiAgICB9KS50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICBsZXQgY2hlY2tUaXRsZSA9IGZhbHNlXHJcbiAgICAgIGNvbnN0IGl0ZW1zID0gcmVzcG9uc2UuaXRlbXNSZXR1cm5lZFxyXG4gICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLm9wdGlvbnMuJHNjb3BlLmZpbmQoYC4ke3RoaXMub3B0aW9ucy5jbGFzc1RhcmdldH1gKS5zaG93KCk7XHJcblxyXG4gICAgICBjb25zdCAkbGlzdFJlc3VsdEhlYWQgPSAkKGA8dWwgY2xhc3M9XCIke3RoaXMub3B0aW9ucy5jbGFzc1RhcmdldExpc3RIZWFkfVwiIC8+YClcclxuICAgICAgY29uc3QgJGxpc3RSZXN1bHQgPSAkKGA8dWwgY2xhc3M9XCIke3RoaXMub3B0aW9ucy5jbGFzc1RhcmdldExpc3R9XCIgLz5gKVxyXG5cclxuICAgICAgaXRlbXMubWFwKGl0ZW0gPT4ge1xyXG4gICAgICAgIGNvbnN0IHsgbmFtZSwgaHJlZiwgdGh1bWIgfSA9IGl0ZW1cclxuICAgICAgICBjb25zdCAkdGh1bWIgPSB0aGlzLl9jaGFuZ2VJbWFnZVNpemUodGh1bWIsIHRoaXMub3B0aW9ucy50aHVtYlNpemUsIDI1KVxyXG4gICAgICAgIGNvbnN0IHByb2R1Y3RJZCA9ICR0aHVtYiAhPT0gJycgPyBpdGVtLml0ZW1zWzBdLnByb2R1Y3RJZCA6IG51bGw7XHJcblxyXG4gICAgICAgIGNvbnN0ICRjb250ZW50VGl0bGUgPSAkKCc8c3BhbiBjbGFzcz1cIm5hbWVcIiAvPicpLnRleHQobmFtZSlcclxuXHJcbiAgICAgICAgY29uc3QgJGxpbmsgPSAkKGA8YSAvPmAsIHtcclxuICAgICAgICAgIGNsYXNzOiB0aGlzLm9wdGlvbnMuY2xhc3NUYXJnZXRMaXN0TGluayxcclxuICAgICAgICAgIGhyZWZcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICAkbGluay5hcHBlbmQoJHRodW1iKVxyXG4gICAgICAgICRsaW5rLmFwcGVuZCgkY29udGVudFRpdGxlKVxyXG5cclxuICAgICAgICBjb25zdCAkaXRlbSA9ICQoYDxsaSBjbGFzcz1cIiR7dGhpcy5vcHRpb25zLmNsYXNzVGFyZ2V0TGlzdEl0ZW19XCIgLz5gKVxyXG5cclxuICAgICAgICBpZiAoJHRodW1iICE9PSAnJykge1xyXG4gICAgICAgICAgJGl0ZW0uYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNsYXNzVGFyZ2V0TGlzdEl0ZW1JbWFnZSlcclxuXHJcbiAgICAgICAgICBpZiAoY2hlY2tUaXRsZSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgJGxpc3RSZXN1bHRIZWFkLmFwcGVuZChgPGxpIGNsYXNzPVwiaGVhZGVyLWFtaXNzaW1hLS1zZWFyY2gtLXByb2R1Y3RzXCI+XHJcbiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cInRpdGxlXCI+UHJvZHV0b3MgU3VnZXJpZG9zPC9wPlxyXG4gICAgICAgICAgICAgIDwvbGk+YCk7XHJcblxyXG4gICAgICAgICAgICBjaGVja1RpdGxlID0gdHJ1ZVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChwcm9kdWN0SWQpIHtcclxuICAgICAgICAgICAgdnRleGpzLmNhdGFsb2cuZ2V0UHJvZHVjdFdpdGhWYXJpYXRpb25zKHByb2R1Y3RJZCkuZG9uZShwcm9kdWN0ID0+IHtcclxuICAgICAgICAgICAgICBpZiAocHJvZHVjdCBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHByb2R1Y3Quc2t1c1swXTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvcHRpb25zJyxvcHRpb25zKTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gbW9uZXlGb3JtYXQobikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnUiQgJyArIChuIC8gMTAwKS50b0ZpeGVkKDIpLnJlcGxhY2UoJy4nLCAnLCcpLnJlcGxhY2UoLyhcXGQpKD89KFxcZHszfSkrKD8hXFxkKSkvZywgXCIkMS5cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYob3B0aW9ucy5hdmFpbGFibGUgPT09IHRydWUpe1xyXG4gICAgICAgICAgICAgICAgICBpZihvcHRpb25zLmxpc3RQcmljZSAhPT0gMCAmJiBvcHRpb25zLmxpc3RQcmljZSAhPT0gb3B0aW9ucy5iZXN0UHJpY2Upe1xyXG4gICAgICAgICAgICAgICAgICAgICRsaW5rLmFwcGVuZChgPHNwYW4gY2xhc3M9XCJwcmljZVwiPkRlICR7b3B0aW9ucy5saXN0UHJpY2VGb3JtYXRlZH08L3NwYW4+YCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICRsaW5rLmFwcGVuZChgPHNwYW4gY2xhc3M9XCJwcmljZS1iZXN0XCI+UG9yICR7b3B0aW9ucy5iZXN0UHJpY2VGb3JtYXRlZH08L3NwYW4+YCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5pbnN0YWxsbWVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAkbGluay5hcHBlbmQoYDxzcGFuIGNsYXNzPVwiaW5zdGFsbG1lbnRzXCI+JHtvcHRpb25zLmluc3RhbGxtZW50c314IGRlICR7bW9uZXlGb3JtYXQob3B0aW9ucy5pbnN0YWxsbWVudHNWYWx1ZSl9IFNlbSBqdXJvczwvc3Bhbj5gKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgIC8vICRsaW5rLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgJGxpbmsuYXBwZW5kKGA8c3BhbiBjbGFzcz1cInByaWNlLWJlc3RcIj5Db25maXJhIG91dHJvcyB0YW1hbmhvczwvc3Bhbj5gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmluc3RhbGxtZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgICRsaW5rLmFwcGVuZChgPHNwYW4gY2xhc3M9XCJpbnN0YWxsbWVudHNcIj4ke29wdGlvbnMuaW5zdGFsbG1lbnRzfTwvc3Bhbj5gKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcblxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICRpdGVtLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jbGFzc1RhcmdldExpc3RJdGVtQ2F0ZWdvcnkpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkaXRlbS5hcHBlbmQoJGxpbmspXHJcblxyXG4gICAgICAgIGlmICgkdGh1bWIgIT09ICcnKSB7XHJcbiAgICAgICAgICAkbGlzdFJlc3VsdC5hcHBlbmQoJGl0ZW0pXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICRsaXN0UmVzdWx0SGVhZC5hcHBlbmQoJGl0ZW0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgcGFyZW50LmVtcHR5KCk7XHJcblxyXG4gICAgICBwYXJlbnQuYXBwZW5kKCRsaXN0UmVzdWx0SGVhZClcclxuICAgICAgcGFyZW50LmFwcGVuZCgkbGlzdFJlc3VsdClcclxuICAgIH0pXHJcbiAgfSxcclxuXHJcbiAgLy8gY2hhbmdlIGltYWdlIHNpemVcclxuICBfY2hhbmdlSW1hZ2VTaXplOiBmdW5jdGlvbiAoaW1hZ2UsIG5ld1NpemUsIGFjdHVhbFNpemUpIHtcclxuICAgIHJldHVybiBpbWFnZVxyXG4gICAgICAucmVwbGFjZShgLSR7YWN0dWFsU2l6ZX0tJHthY3R1YWxTaXplfWAsIGAtJHtuZXdTaXplfS0ke25ld1NpemV9YClcclxuICAgICAgLnJlcGxhY2UoYHdpZHRoPVwiJHthY3R1YWxTaXplfVwiYCwgYHdpZHRoPVwiJHtuZXdTaXplfVwiYClcclxuICAgICAgLnJlcGxhY2UoYGhlaWdodD1cIiR7YWN0dWFsU2l6ZX1cImAsIGBoZWlnaHQ9XCIke25ld1NpemV9XCJgKVxyXG4gIH0sXHJcblxyXG4gIC8vIGlzIG1vYlxyXG4gIF9pc01vYjogZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMub3B0aW9ucy4kbW9iSXNWaXNpYmxlLmlzKCc6dmlzaWJsZScpKSB7XHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfVxyXG59KVxyXG4iLCJBUFAuY29tcG9uZW50LlNlbGVjdCA9IFZ0ZXhDbGFzcy5leHRlbmQoe1xyXG4gIC8vIGluaXRcclxuICBpbml0IChvcHRpb25zKSB7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zXHJcblxyXG4gICAgdGhpcy5zZWxlY3RJdGVtcygkKHRoaXMub3B0aW9ucy5zZWxlY3RvcikpXHJcbiAgfSxcclxuXHJcbiAgLy8gaXRlbXNcclxuICBzZWxlY3RJdGVtcyAoaXRlbXMpIHtcclxuICAgIGlmIChpdGVtcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGl0ZW1zLmVhY2goKGluZGV4LCBlbGVtZW50KSA9PiB7XHJcbiAgICAgICAgY29uc3QgaXRlbSA9ICQoZWxlbWVudClcclxuXHJcbiAgICAgICAgaWYgKGl0ZW0ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgdGhpcy5jcmVhdGVTZWxlY3RGYWtlKGl0ZW0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9LFxyXG4gIFxyXG4gIC8vIGNyZWF0ZSBzZWxlY3QgZmFrZVxyXG4gIGNyZWF0ZVNlbGVjdEZha2UgKGl0ZW0pIHtcclxuICAgIGlmIChpdGVtLmxlbmd0aCA+IDApIHtcclxuICAgICAgY29uc3Qgc2VsZWN0ID0gaXRlbS5maW5kKCdzZWxlY3QnKVxyXG4gICAgICBjb25zdCBzZWxlY3RGYWtlID0gJCgnPGRpdiBjbGFzcz1cImFtaXNzaW1hLXNlbGVjdC0taXRlbVwiPjwvZGl2PicpXHJcblxyXG4gICAgICB0aGlzLmNyZWF0ZVNlbGVjdEZha2VUaXRsZShzZWxlY3RGYWtlLCBzZWxlY3QpXHJcbiAgICAgIHRoaXMuY3JlYXRlU2VsZWN0RmFrZU9wdGlvbnMoc2VsZWN0RmFrZSwgc2VsZWN0KVxyXG5cclxuICAgICAgaXRlbS5hcHBlbmQoc2VsZWN0RmFrZSlcclxuICAgIH1cclxuICB9LFxyXG5cclxuICAvLyBjcmVhdGUgc2VsZWN0IGZha2UgY2xlYXIgb3B0aW9uXHJcbiAgY3JlYXRlU2VsZWN0RmFrZUNsZWFyT3B0aW9uIChvcHRpb24sIG9wdGlvbnMsIG9wdGlvbkZha2UpIHtcclxuICAgIGNvbnN0IGl0ZW1zID0gb3B0aW9uRmFrZS5wYXJlbnQoKS5maW5kKCdidXR0b24ub3B0aW9uJyk7XHJcbiAgICBjb25zdCB0aXRsZSA9IG9wdGlvbkZha2UucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFtaXNzaW1hLXNlbGVjdC0tdGl0bGUnKVxyXG5cclxuICAgIG9wdGlvbnMuZWFjaCgoaW5kZXgsIGl0ZW0pID0+IHtcclxuICAgICAgaWYgKGl0ZW0gIT09IG9wdGlvblswXSkge1xyXG4gICAgICAgICQoaXRlbXNbaW5kZXhdKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgb3B0aW9uRmFrZS5hZGRDbGFzcygnYWN0aXZlJylcclxuICAgIHRpdGxlLnRleHQob3B0aW9uLnRleHQoKSlcclxuICB9LFxyXG5cclxuICAvLyBjcmVhdGUgc2VsZWN0IGZha2Ugb3B0aW9uc1xyXG4gIGNyZWF0ZVNlbGVjdEZha2VPcHRpb25zIChlbGVtZW50LCBzZWxlY3QpIHtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSBzZWxlY3QuZmluZCgnb3B0aW9uW3ZhbHVlXScpXHJcblxyXG4gICAgaWYgKG9wdGlvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICBjb25zdCBjb250ZW50ID0gJCgnPGRpdiBjbGFzcz1cImFtaXNzaW1hLXNlbGVjdC0tY29udGVudFwiPjwvZGl2PicpXHJcbiAgICAgIGVsZW1lbnQuYXBwZW5kKGNvbnRlbnQpXHJcblxyXG4gICAgICBvcHRpb25zLmVhY2goKGluZGV4LCBlbGVtZW50T3B0aW9uKSA9PiB7XHJcbiAgICAgICAgY29uc3Qgb3B0aW9uID0gJChlbGVtZW50T3B0aW9uKVxyXG5cclxuICAgICAgICBpZiAob3B0aW9uLmxlbmd0aCA+IDAgJiYgb3B0aW9uLnZhbCgpICE9PSAnJykge1xyXG4gICAgICAgICAgY29uc3Qgb3B0aW9uRmFrZSA9ICQoYDxidXR0b24gY2xhc3M9XCJvcHRpb25cIj4ke29wdGlvbi50ZXh0KCl9PC9idXR0b24+YClcclxuXHJcbiAgICAgICAgICBvcHRpb25GYWtlLm9uKCdjbGljaycsIGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgc2VsZWN0LnZhbChvcHRpb24udmFsKCkpLmNoYW5nZSgpXHJcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlU2VsZWN0RmFrZUNsZWFyT3B0aW9uKG9wdGlvbiwgb3B0aW9ucywgJChldmVudC50YXJnZXQpKVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgY29udGVudC5hcHBlbmQob3B0aW9uRmFrZSlcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gY3JlYXRlIHNlbGVjdCBmYWtlIHRpdGxlXHJcbiAgY3JlYXRlU2VsZWN0RmFrZVRpdGxlIChlbGVtZW50LCBzZWxlY3QpIHtcclxuICAgIGNvbnN0IG9wdGlvbkluaXQgPSBzZWxlY3QuZmluZCgnb3B0aW9uW3ZhbHVlPVwiXCJdJylcclxuICAgIGNvbnN0IHRleHRJbml0ID0gb3B0aW9uSW5pdC5sZW5ndGggPT09IDAgPyAnU2VsZWNpb25lIHVtYSBvcMOnw6NvJyA6IG9wdGlvbkluaXQudGV4dCgpXHJcblxyXG4gICAgY29uc3QgdGl0bGUgPSAkKGA8ZGl2IGNsYXNzPVwiYW1pc3NpbWEtc2VsZWN0LS10aXRsZVwiPiR7dGV4dEluaXR9PC9kaXY+YClcclxuICAgIGVsZW1lbnQuYXBwZW5kKHRpdGxlKVxyXG5cclxuICAgIGVsZW1lbnQub24oJ2NsaWNrJywgZXZlbnQgPT4ge1xyXG4gICAgICBlbGVtZW50LnRvZ2dsZUNsYXNzKHRvZ2dsZSA9PiB0aGlzLmNsb3NlU2VsZWN0Qm9keShlbGVtZW50LCB0b2dnbGUpKVxyXG5cclxuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMuY2FsbGJhY2soKVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvLyBjbG9zZSBzZWxlY3QgYm9keVxyXG4gIGNsb3NlU2VsZWN0Qm9keSAoZWxlbWVudCwgdG9nZ2xlKSB7XHJcbiAgICBpZiAodG9nZ2xlID09PSAwKSB7XHJcbiAgICAgICQoJ2JvZHknKS5vbignY2xpY2snLCBldmVudCA9PiB7XHJcbiAgICAgICAgY29uc3QgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBldmVudFxyXG4gICAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSBlbGVtZW50WzBdLnBhcmVudEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcclxuXHJcbiAgICAgICAgaWYgKGNsaWVudFggPCBwcm9wZXJ0aWVzLnggfHwgKHByb3BlcnRpZXMueCArIHByb3BlcnRpZXMud2lkdGgpIDwgY2xpZW50WCkge1xyXG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVDbGFzcygnYWN0aXZlJylcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjbGllbnRZIDwgcHJvcGVydGllcy55IHx8IChwcm9wZXJ0aWVzLnkgKyBwcm9wZXJ0aWVzLmhlaWdodCkgPCBjbGllbnRZKSB7XHJcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gJ2FjdGl2ZSdcclxuICAgIH1cclxuXHJcbiAgICAkKCdib2R5Jykub2ZmKCdjbGljaycsICgpID0+IHt9KTtcclxuICAgIHJldHVybiAnYWN0aXZlJ1xyXG4gIH0sXHJcbn0pXHJcbiIsIkFQUC5jb21wb25lbnQuU2hlbGYgPSBWdGV4Q2xhc3MuZXh0ZW5kKHtcclxuICAvLyBpbml0XHJcbiAgaW5pdCAoZWxlbWVudCkge1xyXG4gICAgJChkb2N1bWVudCkuYWpheFN0b3AoKCkgPT4ge1xyXG4gICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xyXG5cclxuICAgICAgaWYgKHRoaXMuZWxlbWVudCBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICAgIHRoaXMuc2t1UHJvZHVjdCh0aGlzLmVsZW1lbnQpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvLyBza3UgYnV0dG9uXHJcbiAgc2t1QnV0dG9uIChza3UsIHBhcmVudCwgaW5kZXgpIHtcclxuICAgIGlmIChza3UgaW5zdGFuY2VvZiBPYmplY3QgJiYgcGFyZW50IGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgIGNvbnN0IGNvbG9yID0gdGhpcy5zcGFjZVJlcGxhY2Uoc2t1LmRpbWVuc2lvbnMuQ29yKTtcclxuICAgICAgY29uc3QgYnV0dG9uID0gJChgPGJ1dHRvbiBjbGFzcz1cImNvbG9yXCIgdGl0bGU9JHtjb2xvcn0+XHJcbiAgICAgICAgICA8aW1nIGNsYXNzPVwiYWN0aXZlXCIgb25FcnJvcj1cInRoaXMuY2xhc3NOYW1lPScnXCIgc3JjPVwiL2FycXVpdm9zL2NvbG9yLSR7Y29sb3J9LnBuZ1wiIGFsdD0ke2NvbG9yfSAvPlxyXG4gICAgICAgIDwvYnV0dG9uPmApXHJcblxyXG4gICAgICBidXR0b24ub24oJ2NsaWNrJywgZXZlbnQgPT4ge1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBwYXJlbnQucGFyZW50KClcclxuXHJcbiAgICAgICAgaWYgKGVsZW1lbnQubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgY29uc3QgaW1hZ2UgPSBlbGVtZW50LmZpbmQoJy5wcm9kdWN0LWltYWdlIGltZycpXHJcbiAgICAgICAgICBjb25zdCBsaXN0UHJpY2UgPSBlbGVtZW50LmZpbmQoJy5wcm9kdWN0LWluZm8gLnByaWNlIC5uZXctcHJpY2UgLmxpc3QtcHJpY2UnKVxyXG4gICAgICAgICAgY29uc3QgcHJpY2UgPSBlbGVtZW50LmZpbmQoJy5wcm9kdWN0LWluZm8gLnByaWNlIC5uZXctcHJpY2UgLmJlc3QtcHJpY2UnKVxyXG5cclxuICAgICAgICAgIGltYWdlLmF0dHIoJ3NyYycsIHNrdS5pbWFnZS5yZXBsYWNlKFwiMzAwLTQ1MFwiLFwiNDcwLTcwMFwiKSk7XHJcblxyXG4gICAgICAgICAgLy8gaWYoc2t1LmF2YWlsYWJsZSA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAvLyAgIHByaWNlLnRleHQoc2t1LmJlc3RQcmljZUZvcm1hdGVkKVxyXG4gICAgICAgICAgLy8gfWVsc2V7XHJcbiAgICAgICAgICAvLyAgIHByaWNlLnRleHQoJ0luZGlzcG9uw612ZWwnKTtcclxuICAgICAgICAgIC8vIH1cclxuICAgICAgICAgIC8vXHJcbiAgICAgICAgICAvLyBpZihsaXN0UHJpY2Upe1xyXG4gICAgICAgICAgLy8gICBsaXN0UHJpY2UudGV4dChza3UubGlzdFByaWNlRm9ybWF0ZWQpXHJcbiAgICAgICAgICAvLyB9XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBjb25zb2xlLmxvZygnc2hlbGYgc2t1Jywgc2t1KVxyXG5cclxuICAgICAgICAgIHRoaXMuc2t1QnV0dG9uQ2xlYXIoJChldmVudC50YXJnZXQpKVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBwYXJlbnQuYXBwZW5kKGJ1dHRvbilcclxuXHJcbiAgICAgIGlmIChpbmRleCA9PT0gMCkge1xyXG4gICAgICAgIGJ1dHRvbi5hZGRDbGFzcygnYWN0aXZlJylcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIHNrdSBidXR0b24gY2xlYXJcclxuICBza3VCdXR0b25DbGVhciAoYnV0dG9uKSB7XHJcbiAgICBpZiAoYnV0dG9uLmxlbmd0aCA+IDApIHtcclxuICAgICAgY29uc3QgYnV0dG9ucyA9IGJ1dHRvbi5wYXJlbnQoKS5maW5kKCdidXR0b24nKVxyXG5cclxuICAgICAgYnV0dG9ucy5lYWNoKChpbmRleCwgaXRlbSkgPT4ge1xyXG4gICAgICAgICQoaXRlbSkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgYnV0dG9uLmFkZENsYXNzKCdhY3RpdmUnKVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIHNrdSBmaW5kXHJcbiAgc2t1RmluZCAoc2t1c1Byb2R1Y3QsIHNrdSkge1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc2t1c1Byb2R1Y3QpID09PSBmYWxzZSAmJiBza3UgaW5zdGFuY2VvZiBPYmplY3QgPT09IGZhbHNlKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY2hlY2sgPSBmYWxzZTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNrdXNQcm9kdWN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IHNrdVRlbXAgPSBza3VzUHJvZHVjdFtpXTtcclxuXHJcbiAgICAgIGlmIChza3VUZW1wLmRpbWVuc2lvbnMuQ29yID09PSBza3UuZGltZW5zaW9ucy5Db3IpIHtcclxuICAgICAgICBjaGVjayA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2hlY2s7XHJcbiAgfSxcclxuXHJcbiAgLy8gc2t1IGZpbHRlclxyXG4gIHNrdUZpbHRlciAoc2t1cykge1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc2t1cykgPT09IGZhbHNlKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBza3VzUHJvZHVjdCA9IFtdO1xyXG5cclxuICAgICQuZWFjaChza3VzLCAoaW5kZXgsIHNrdSkgPT4ge1xyXG4gICAgICBpZiAoaW5kZXggPT09IDApIHtcclxuICAgICAgICBza3VzUHJvZHVjdC5wdXNoKHNrdSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLnNrdUZpbmQoc2t1c1Byb2R1Y3QsIHNrdSkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgc2t1c1Byb2R1Y3QucHVzaChza3UpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gc2t1c1Byb2R1Y3Q7XHJcbiAgfSxcclxuXHJcbiAgLy8gc2t1IHByb2R1Y3RcclxuICBza3VQcm9kdWN0IChzaGVsZikge1xyXG4gICAgY29uc3QgcHJvZHVjdHMgPSAkKHNoZWxmKS5maW5kKCcuYW1pc3NpbWEtLXNoZWxmLS1pdGVtJylcclxuXHJcbiAgICAkLmVhY2gocHJvZHVjdHMsIChpbmRleCwgZWxlbWVudCkgPT4ge1xyXG4gICAgICBjb25zdCBpdGVtID0gJChlbGVtZW50KVxyXG4gICAgICBjb25zdCBwcm9kdWN0SWQgPSBwYXJzZUludChpdGVtLmF0dHIoJ2RhdGEtaWQnKSlcclxuXHJcbiAgICAgIGlmIChwcm9kdWN0SWQpIHtcclxuICAgICAgICB2dGV4anMuY2F0YWxvZy5nZXRQcm9kdWN0V2l0aFZhcmlhdGlvbnMocHJvZHVjdElkKS5kb25lKHByb2R1Y3QgPT4ge1xyXG4gICAgICAgICAgaWYgKHByb2R1Y3QgaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAgICAgdGhpcy5za3VQcm9kdWN0SW5zZXJ0KHByb2R1Y3Quc2t1cywgaXRlbSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLy8gc2t1IHByb2R1Y3QgaW5zZXJ0XHJcbiAgc2t1UHJvZHVjdEluc2VydCAoc2t1cywgaXRlbSkge1xyXG4gICAgaWYgKHNrdXMgaW5zdGFuY2VvZiBPYmplY3QgJiYgaXRlbSBpbnN0YW5jZW9mIE9iamVjdCkge1xyXG4gICAgICBjb25zdCBsaXN0ID0gaXRlbS5maW5kKCcucHJvZHVjdC1za3VzJyk7XHJcblxyXG4gICAgICBpZiAobGlzdC5sZW5ndGggIT09IDApIHtcclxuICAgICAgICBjb25zdCBza3VzRmlsdGVyID0gdGhpcy5za3VGaWx0ZXIoc2t1cyk7XHJcblxyXG4gICAgICAgIGlmIChza3VzRmlsdGVyLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIGxpc3QuZW1wdHkoKVxyXG5cclxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2t1c0ZpbHRlci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBza3UgPSBza3VzRmlsdGVyW2ldXHJcblxyXG4gICAgICAgICAgICBpZiAoaSA8IDMpIHtcclxuICAgICAgICAgICAgICB0aGlzLnNrdUJ1dHRvbihza3UsIGxpc3QsIGkpXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgbW9yZVRleHQgPSAkKGA8ZGl2IGNsYXNzPVwibW9yZVwiPisgJHtza3VzRmlsdGVyLmxlbmd0aCAtIGl9PC9kaXY+YClcclxuICAgICAgICAgICAgICBsaXN0LmFwcGVuZChtb3JlVGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIHNwYWNlIHJlcGxhY2VcclxuICBzcGFjZVJlcGxhY2UgKGNsYXNzTmFtZSkge1xyXG4gICAgcmV0dXJuIGNsYXNzTmFtZS5yZXBsYWNlKC9cXHMrL2csICctJykudG9Mb3dlckNhc2UoKVxyXG4gIH1cclxufSlcclxuIiwiQVBQLmNvbnRyb2xsZXIuU3RvcmVzID0gVnRleENsYXNzLmV4dGVuZCh7XHJcbiAgaW5pdDogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBzZWxmLnNldHVwKCk7XHJcbiAgICBzZWxmLnN0YXJ0KCk7XHJcbiAgICBzZWxmLmJpbmQoKTtcclxuICB9LFxyXG5cclxuICBzZXR1cDogZnVuY3Rpb24oKSB7XHJcblxyXG4gIH0sXHJcblxyXG4gIHN0YXJ0OiBmdW5jdGlvbigpIHtcclxuICAgIFxyXG4gIH0sXHJcblxyXG5cclxuICBiaW5kOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgfVxyXG5cclxufSk7XHJcbiIsIlxyXG4vKlxyXG5Vc2UgdGhpcyBjb21wb25lbnRcclxuXHJcbm5ldyBBUFAuY29tcG9uZW50LnZpZGVvVGh1bWIoe1xyXG4gICAgICBmaWVsZENsYXNzOiAnLnZhbHVlLWZpZWxkLlZpZGVvJyxcclxuICAgICAgd2lkdGg6IDQwMCxcclxuICAgICAgaGVpZ2h0OiA0MDAsXHJcbiAgICAgIHRodW1iOiAnL2FycXVpdm9zL3RodW1iLXZpZGVvLmpwZycsXHJcbiAgICAgIHBvc2l0aW9uVGh1bWI6ICdib3R0b20nXHJcbiAgICB9KVxyXG5cclxuXHJcbiAqL1xyXG5BUFAuY29tcG9uZW50LnZpZGVvVGh1bWIgPSBWdGV4Q2xhc3MuZXh0ZW5kKHtcclxuICBpbml0OiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgdGhpcy5zZXR1cChvcHRpb25zKVxyXG4gICAgdGhpcy5tYW5hZ2VDb250ZW50KClcclxuICAgIHRoaXMuYmluZEV2ZW50cygpXHJcbiAgfSxcclxuXHJcbiAgc2V0dXA6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgZmllbGRDbGFzczogJy5WaWRlbycsXHJcbiAgICAgICAgd2lkdGg6IDUwMCxcclxuICAgICAgICBoZWlnaHQ6IDUwMCxcclxuICAgICAgICB0aHVtYjogJy9hcnF1aXZvcy90aHVtYi12aWRlby5wbmcnLFxyXG4gICAgICAgIHBvc2l0aW9uVGh1bWI6ICdib3R0b20nIC8vdG9wXHJcbiAgICB9LCBvcHRpb25zKVxyXG4gIH0sXHJcblxyXG5cclxuICBtYW5hZ2VDb250ZW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGZpZWxkQ2xhc3MgPSB0aGlzLm9wdGlvbnMuZmllbGRDbGFzcy5yZXBsYWNlKCcuJywnJyksXHJcbiAgICAgICAgICB2aWRlbyA9ICQoJy52YWx1ZS1maWVsZC4nK2ZpZWxkQ2xhc3MpLmh0bWwoKSxcclxuICAgICAgICAgIC8vdmlkZW8gPSAnaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj16UnhHUlg2VnJ4VScsXHJcbiAgICAgICAgICB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgIGlmICh2aWRlbyAmJiAodmlkZW8uaW5kZXhPZigneW91dHViZScpID4gLTEgfHwgdmlkZW8uaW5kZXhPZigneW91dHUuYmUnKSA+IC0xKSkge1xyXG4gICAgICAgICAgJCgnLnZhbHVlLWZpZWxkLicrZmllbGRDbGFzcysnLCAubmFtZS1maWVsZC4nK2ZpZWxkQ2xhc3MpLmhpZGUoKTtcclxuICAgICAgICAgICQoJy50aHVtYnMgYScpLmZpcnN0KCkuY2xpY2soKTtcclxuICAgICAgICAgICQoJy52aWRlb1dyYXBwZXInKS5yZW1vdmUoKTtcclxuICAgICAgICAgICQoJyNpbmNsdWRlJykuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidmlkZW9XcmFwcGVyXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmU7XCI+PGlmcmFtZSB3aWR0aD1cIicrdGhhdC5vcHRpb25zLndpZHRoKydcIiBoZWlnaHQ9XCInK3RoYXQub3B0aW9ucy5oZWlnaHQrJ1wiIHNyYz1cIlwiIGZyYW1lYm9yZGVyPVwiMFwiIGFsbG93ZnVsbHNjcmVlbj1cIlwiIGFsbG93dHJhbnNwYXJlbmN5PVwidHJ1ZVwiPjwvaWZyYW1lPjwvZGl2PicpO1xyXG4gICAgICAgICAgJCgnLnZhbHVlLWZpZWxkLicrZmllbGRDbGFzcykuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICB2YXIgc3JjID0gJCh0aGlzKS5odG1sKCk7XHJcbiAgICAgICAgICAgICAgaWYoc3JjLmluZGV4T2YoJ3lvdXR1YmUnKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgIHNyYyA9ICggJCh0aGlzKS5maW5kKCdpZnJhbWUnKS5sZW5ndGggPiAwID8gJCh0aGlzKS5maW5kKCdpZnJhbWUnKS5hdHRyKCdzcmMnKSA6ICdodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8nK3NyYy5zcGxpdCgndj0nKS5yZXZlcnNlKClbMF0gKVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgc3JjID0gKCAkKHRoaXMpLmZpbmQoJ2lmcmFtZScpLmxlbmd0aCA+IDAgPyAkKHRoaXMpLmZpbmQoJ2lmcmFtZScpLmF0dHIoJ3NyYycpIDogJ2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLycrc3JjLnNwbGl0KCcvJykucmV2ZXJzZSgpWzBdIClcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgdmFyIGxpc3RJdGVtID0gJzxsaSBjbGFzcz1cInRyaWdnZXItdmlkZW9cIiBzdHlsZT1cImN1cnNvcjpwb2ludGVyO1wiPjxpbWcgcmVsPVwiJyArIHNyYyArICdcIiBzcmM9XCInK3RoYXQub3B0aW9ucy50aHVtYisnXCIgLz48L2xpPidcclxuXHJcbiAgICAgICAgICAgICAgc3dpdGNoICh0aGF0Lm9wdGlvbnMucG9zaXRpb25UaHVtYikge1xyXG4gICAgICAgICAgICAgICAgICBjYXNlICd0b3AnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgJCgnLnRodW1icycpLnByZXBlbmQobGlzdEl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAkKCcudGh1bWJzJykuYXBwZW5kKGxpc3RJdGVtKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gIH0sXHJcblxyXG4gIGJpbmRFdmVudHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAkKCdsaS50cmlnZ2VyLXZpZGVvJykuYmluZChcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgJCgnI2luY2x1ZGUgZGl2I2ltYWdlJykuaGlkZSgpO1xyXG4gICAgICAgICAgdmFyIG5ld1JlbCA9ICQodGhpcykuZmluZCgnaW1nJykuYXR0cigncmVsJyksXHJcbiAgICAgICAgICAgICAgcmVsID0gJCgnI2luY2x1ZGUgLnZpZGVvV3JhcHBlciBpZnJhbWUnKS5hdHRyKCdzcmMnKTtcclxuICAgICAgICAgIGlmKG5ld1JlbCAhPT0gcmVsKXtcclxuICAgICAgICAgICAgICAkKCcjaW5jbHVkZSAudmlkZW9XcmFwcGVyIGlmcmFtZScpLmF0dHIoJ3NyYycsIG5ld1JlbCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZighJCgnI2luY2x1ZGUgLnZpZGVvV3JhcHBlcicpLmlzKCc6dmlzaWJsZScpKXtcclxuICAgICAgICAgICAgICAkKCcjaW5jbHVkZSAudmlkZW9XcmFwcGVyJykuZmFkZUluKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAkKCcuT04nKS5yZW1vdmVDbGFzcygnT04nKTtcclxuICAgICAgICAgICQodGhpcykuZmluZCgnaW1nJykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgICQoJ3VsLnRodW1icyBsaSBhJykubGl2ZSgnY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICQoJ2xpLnRyaWdnZXItdmlkZW8gaW1nJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgICAgJCgnI2luY2x1ZGUgLnZpZGVvV3JhcHBlcicpLmhpZGUoKTtcclxuICAgICAgICAgICQoJyNpbmNsdWRlIGRpdiNpbWFnZScpLmZhZGVJbigpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIEluaWNpYW5kbyBvIHRodW1iIGNvbSBvIHbDg8KtZGVvIGF0aXZhZG9cclxuICAgICAgLy8gJCgnbGkudHJpZ2dlci12aWRlbycpLmNsaWNrKCk7XHJcbiAgICAgICQoJy5hcHJlc2VudGFjYW8nKS5hZGRDbGFzcygndmlkZW8taW5pdGlhbGl6ZWQnKTtcclxuXHJcbiAgICAgIC8vIENvcnJlw4PCp8ODwqNvIHBhcmEgbyB0aHVtYiBpbmljaWFsIGRhIFZ0ZXggcXVlIHJlY2ViZSBhIGNsYXNzIE9OIGFww4PCs3MgYSBleGVjdcODwqfDg8KjbyBkbyBtw4PCs2R1bG8gdmlkZW9UaHVtYlxyXG4gICAgICBpZigkKCcuYXByZXNlbnRhY2FvJykuZmluZCgnaWZyYW1lJykubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgJChkb2N1bWVudCkub25lKCdhamF4U3RvcCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICQoJy5PTicpLnJlbW92ZUNsYXNzKCdPTicpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICB9XHJcblxyXG59KVxyXG4iXX0=
