(function(){var t;t=function(e){var d;return d=$({}),function(i){var t,o,n,s,a;return n=void 0,o=$.Deferred(),s=o.promise(),a=function(t){return(n=e(i)).retry&&n.retry({times:2,statusCodes:[500,503]}),n.done(o.resolve).fail(o.reject).then(t,t)},t=function(t){var e,r;return n?n.abort(t):(r=d.queue(),-1<(e=[].indexOf.call(r,a))&&r.splice(e,1),o.rejectWith(i.context||i,[s,t,""]),s)},d.queue(a),s.abort=t,s}},window.AjaxQueue=t}).call(this),function(){var t,e,r=function(t,e){return function(){return t.apply(e,arguments)}};(e=window.location).origin||(e.origin=window.location.protocol+"//"+window.location.hostname+(window.location.port?":"+window.location.port:"")),t=function(){var e;function t(t){null==t&&(t={}),this.getCurrentProductWithVariations=r(this.getCurrentProductWithVariations,this),this.setProductWithVariationsCache=r(this.setProductWithVariationsCache,this),this.getProductWithVariations=r(this.getProductWithVariations,this),t.hostURL&&(e=t.hostURL),t.ajax?this.ajax=t.ajax:window.AjaxQueue?this.ajax=window.AjaxQueue($.ajax):this.ajax=$.ajax,this.promise=t.promise||$.when,this.cache={productWithVariations:{}}}return e=window.location.origin,t.prototype.getProductWithVariations=function(e){var r=this;return this.promise(this.cache.productWithVariations[e]||$.ajax(this._getBaseCatalogSystemURL()+"/products/variations/"+e)).done(function(t){return r.setProductWithVariationsCache(e,t)})},t.prototype.setProductWithVariationsCache=function(t,e){return this.cache.productWithVariations[t]=e},t.prototype.getCurrentProductWithVariations=function(){var t,e,r;if(window.skuJson)return this.promise(window.skuJson);for(t in r=this.cache.productWithVariations)return e=r[t],this.promise(e)},t.prototype._getBaseCatalogSystemURL=function(){return e+"/api/catalog_system/pub"},t}(),window.vtexjs||(window.vtexjs={}),window.vtexjs.Catalog=t,window.vtexjs.catalog=new window.vtexjs.Catalog}.call(this),function(){var t,r,i,e,o,n,s,a,d,p=[].slice,h=function(t,e){return function(){return t.apply(e,arguments)}};n=function(t){return t.replace(/^\s+|\s+$/g,"")},r=function(t,e,r,i,o){var n,s,a,d,h,u,c;for(s={},d=0,h=(u=t.split(e)).length;d<h;d++)n=(c=u[d].split(r))[0],a=2<=c.length?p.call(c,1):[],s[i(n)]=o(a.join("="));return s},a=function(){return r(window.location.search.substring(1),"&","=",decodeURIComponent,decodeURIComponent)},s=function(t){return a()[t]},e=function(){return r(document.cookie,";","=",n,unescape)},i=function(t){return e()[t]},o=function(t,e){return r(e,"&","=",function(t){return t},unescape)[t]},(d=window.location).origin||(d.origin=window.location.protocol+"//"+window.location.hostname+(window.location.port?":"+window.location.port:"")),t=function(){var r,e;function t(t){null==t&&(t={}),this._getFinishTransactionURL=h(this._getFinishTransactionURL,this),this._getGatewayCallbackURL=h(this._getGatewayCallbackURL,this),this._getProfileURL=h(this._getProfileURL,this),this._getPostalCodeURL=h(this._getPostalCodeURL,this),this._getSimulationURL=h(this._getSimulationURL,this),this._getOrdersURL=h(this._getOrdersURL,this),this._manualPriceURL=h(this._manualPriceURL,this),this._getAddToCartURL=h(this._getAddToCartURL,this),this._getRemoveGiftRegistryURL=h(this._getRemoveGiftRegistryURL,this),this._getUpdateSelectableGifts=h(this._getUpdateSelectableGifts,this),this._getCloneItemURL=h(this._getCloneItemURL,this),this._getUpdateItemURL=h(this._getUpdateItemURL,this),this._startTransactionURL=h(this._startTransactionURL,this),this._getAddCouponURL=h(this._getAddCouponURL,this),this._getCustomDataUrl=h(this._getCustomDataUrl,this),this._getChangeOrdinationURL=h(this._getChangeOrdinationURL,this),this._getItemAttachmentURL=h(this._getItemAttachmentURL,this),this._getBundleItemAttachmentURL=h(this._getBundleItemAttachmentURL,this),this._getRemoveOfferingsURL=h(this._getRemoveOfferingsURL,this),this._getAddOfferingsURL=h(this._getAddOfferingsURL,this),this._getSaveAttachmentURL=h(this._getSaveAttachmentURL,this),this._getOrderFormURLWithId=h(this._getOrderFormURLWithId,this),this._getOrderFormURL=h(this._getOrderFormURL,this),this._getOrderFormIdFromURL=h(this._getOrderFormIdFromURL,this),this._getOrderFormIdFromCookie=h(this._getOrderFormIdFromCookie,this),this._getOrderFormId=h(this._getOrderFormId,this),this.replaceSKU=h(this.replaceSKU,this),this.getChangeToAnonymousUserURL=h(this.getChangeToAnonymousUserURL,this),this.removeAccountId=h(this.removeAccountId,this),this.clearMessages=h(this.clearMessages,this),this.getOrders=h(this.getOrders,this),this.startTransaction=h(this.startTransaction,this),this.getProfileByEmail=h(this.getProfileByEmail,this),this.getAddressInformation=h(this.getAddressInformation,this),this.simulateShipping=h(this.simulateShipping,this),this.calculateShipping=h(this.calculateShipping,this),this.removeGiftRegistry=h(this.removeGiftRegistry,this),this.removeDiscountCoupon=h(this.removeDiscountCoupon,this),this.setCustomData=h(this.setCustomData,this),this.addDiscountCoupon=h(this.addDiscountCoupon,this),this.removeBundleItemAttachment=h(this.removeBundleItemAttachment,this),this.addBundleItemAttachment=h(this.addBundleItemAttachment,this),this.removeItemAttachment=h(this.removeItemAttachment,this),this.addItemAttachment=h(this.addItemAttachment,this),this.removeManualPrice=h(this.removeManualPrice,this),this.setManualPrice=h(this.setManualPrice,this),this.changeItemsOrdination=h(this.changeItemsOrdination,this),this.cloneItem=h(this.cloneItem,this),this.removeAllItems=h(this.removeAllItems,this),this.removeItems=h(this.removeItems,this),this.updateItems=h(this.updateItems,this),this.addToCart=h(this.addToCart,this),this.removeOffering=h(this.removeOffering,this),this.addOffering=h(this.addOffering,this),this.addOfferingWithInfo=h(this.addOfferingWithInfo,this),this.updateSelectableGifts=h(this.updateSelectableGifts,this),this.finishTransaction=h(this.finishTransaction,this),this.sendLocale=h(this.sendLocale,this),this.sendAttachment=h(this.sendAttachment,this),this.getOrderForm=h(this.getOrderForm,this),this._updateOrderForm=h(this._updateOrderForm,this),this._broadcastOrderFormUnlessPendingRequests=h(this._broadcastOrderFormUnlessPendingRequests,this),this._decreasePendingRequests=h(this._decreasePendingRequests,this),this._increasePendingRequests=h(this._increasePendingRequests,this),this._cacheOrderForm=h(this._cacheOrderForm,this),t.hostURL&&(r=t.hostURL),t.ajax?this.ajax=t.ajax:window.AjaxQueue?this.ajax=window.AjaxQueue($.ajax):this.ajax=$.ajax,this.promise=t.promise||$.when,this.CHECKOUT_ID="checkout",this.orderForm=void 0,this.orderFormId=void 0,this._pendingRequestCounter=0,this._urlToRequestMap={},this._allOrderFormSections=["items","totalizers","clientProfileData","shippingData","paymentData","sellers","messages","marketingData","clientPreferencesData","storePreferencesData","giftRegistryData","ratesAndBenefitsData","openTextField","commercialConditionData","customData"]}return r=window.location.origin,e={ORDER_FORM_UPDATED:"orderFormUpdated.vtex",REQUEST_BEGIN:"checkoutRequestBegin.vtex",REQUEST_END:"checkoutRequestEnd.vtex"},t.prototype._cacheOrderForm=function(t){return this.orderFormId=t.orderFormId,this.orderForm=t},t.prototype._increasePendingRequests=function(t){return this._pendingRequestCounter++,$(window).trigger(e.REQUEST_BEGIN,[t])},t.prototype._decreasePendingRequests=function(){return this._pendingRequestCounter--,$(window).trigger(e.REQUEST_END,arguments)},t.prototype._broadcastOrderFormUnlessPendingRequests=function(t){if(0===this._pendingRequestCounter)return $(window).trigger(e.ORDER_FORM_UPDATED,[t])},t.prototype._orderFormHasExpectedSections=function(t,e){var r,i;if(!t||!t instanceof Object)return!1;for(r=0,i=e.length;r<i;r++)if(!t[e[r]])return!1;return!0},t.prototype._updateOrderForm=function(t){var e,r,i=this;if(!(null!=t?t.url:void 0))throw new Error("options.url is required when sending request");return t.type||(t.type="POST"),t.contentType||(t.contentType="application/json; charset=utf-8"),t.dataType||(t.dataType="json"),this._increasePendingRequests(t),e=this.ajax(t),null!=(r=this._urlToRequestMap[t.url])&&r.abort(),(this._urlToRequestMap[t.url]=e).always(function(){return delete i._urlToRequestMap[t.url]}),e.always(this._decreasePendingRequests),e.done(this._cacheOrderForm),e.done(this._broadcastOrderFormUnlessPendingRequests),e},t.prototype.getOrderForm=function(t){var e,r;return null==t&&(t=this._allOrderFormSections),this._orderFormHasExpectedSections(this.orderForm,t)?this.promise(this.orderForm):(e={expectedOrderFormSections:t},(r=this.ajax({url:this._getOrderFormURLWithId(),type:"POST",contentType:"application/json; charset=utf-8",dataType:"json",data:JSON.stringify(e)})).done(this._cacheOrderForm),r.done(this._broadcastOrderFormUnlessPendingRequests))},t.prototype.sendAttachment=function(t,e,r){var i;return null==r&&(r=this._allOrderFormSections),void 0===t||void 0===e?((i=$.Deferred()).reject("Invalid arguments"),i.promise()):(e.expectedOrderFormSections=r,this._updateOrderForm({url:this._getSaveAttachmentURL(t),data:JSON.stringify(e)}))},t.prototype.sendLocale=function(t){return null==t&&(t="pt-BR"),this.sendAttachment("clientPreferencesData",{locale:t},[])},t.prototype.finishTransaction=function(t,e){return null==e&&(e=this._allOrderFormSections),this._updateOrderForm({url:this._getFinishTransactionURL(t)})},t.prototype.updateSelectableGifts=function(t,e,r){var i;return null==r&&(r=this._allOrderFormSections),i={id:t,selectedGifts:e,expectedOrderFormSections:r},this._updateOrderForm({url:this._getUpdateSelectableGifts(t),data:JSON.stringify(i)})},t.prototype.addOfferingWithInfo=function(t,e,r,i){var o;return null==i&&(i=this._allOrderFormSections),o={id:t,info:e,expectedOrderFormSections:i},this._updateOrderForm({url:this._getAddOfferingsURL(r),data:JSON.stringify(o)})},t.prototype.addOffering=function(t,e,r){return this.addOfferingWithInfo(t,null,e,r)},t.prototype.removeOffering=function(t,e,r){var i;return null==r&&(r=this._allOrderFormSections),i={Id:t,expectedOrderFormSections:r},this._updateOrderForm({url:this._getRemoveOfferingsURL(e,t),data:JSON.stringify(i)})},t.prototype.addToCart=function(t,e,r){var i,o;return null==e&&(e=this._allOrderFormSections),i={orderItems:t,expectedOrderFormSections:e},o="",r&&(o="?sc="+r),this._updateOrderForm({url:this._getAddToCartURL()+o,data:JSON.stringify(i)})},t.prototype.updateItems=function(t,e,r){var i;return null==e&&(e=this._allOrderFormSections),null==r&&(r=!0),i={orderItems:t,expectedOrderFormSections:e,noSplitItem:!r},this._updateOrderForm({url:this._getUpdateItemURL(),data:JSON.stringify(i)})},t.prototype.removeItems=function(t,e){var r,i,o,n,s;if(null==e&&(e=this._allOrderFormSections),t&&0===t.length)return this.getOrderForm(e);for(o=[],r=n=0,s=t.length;n<s;r=++n)i=t[r],o.push({index:i.index,quantity:0});return this.updateItems(o,e)},t.prototype.removeAllItems=function(s){var a=this;return null==s&&(s=this._allOrderFormSections),this.getOrderForm(["items"]).then(function(t){var e,r,i,o,n;if((r=t.items)&&0===r.length)return t;for(i=[],e=o=0,n=r.length;o<n;e=++o)r[e],i.push({index:e,quantity:0});return a.updateItems(i,s)})},t.prototype.cloneItem=function(t,e,r){return null==r&&(r=this._allOrderFormSections),this._updateOrderForm({url:this._getCloneItemURL(t),data:JSON.stringify(e)})},t.prototype.changeItemsOrdination=function(t,e,r){var i;return null==r&&(r=this._allOrderFormSections),i={criteria:t,ascending:e,expectedOrderFormSections:r},this._updateOrderForm({url:this._getChangeOrdinationURL(),data:JSON.stringify(i)})},t.prototype.setManualPrice=function(t,e){var r;return r={price:e},this._updateOrderForm({url:this._manualPriceURL(t),type:"PUT",contentType:"application/json; charset=utf-8",dataType:"json",data:JSON.stringify(r)})},t.prototype.removeManualPrice=function(t){return this._updateOrderForm({url:this._manualPriceURL(t),type:"DELETE",contentType:"application/json; charset=utf-8",dataType:"json"})},t.prototype.addItemAttachment=function(t,e,r,i,o){var n;return null==i&&(i=this._allOrderFormSections),null==o&&(o=!0),n={content:r,expectedOrderFormSections:i,noSplitItem:!o},this._updateOrderForm({url:this._getItemAttachmentURL(t,e),data:JSON.stringify(n)})},t.prototype.removeItemAttachment=function(t,e,r,i){var o;return null==i&&(i=this._allOrderFormSections),o={content:r,expectedOrderFormSections:i},this._updateOrderForm({url:this._getItemAttachmentURL(t,e),type:"DELETE",data:JSON.stringify(o)})},t.prototype.addBundleItemAttachment=function(t,e,r,i,o){var n;return null==o&&(o=this._allOrderFormSections),n={content:i,expectedOrderFormSections:o},this._updateOrderForm({url:this._getBundleItemAttachmentURL(t,e,r),data:JSON.stringify(n)})},t.prototype.removeBundleItemAttachment=function(t,e,r,i,o){var n;return null==o&&(o=this._allOrderFormSections),n={content:i,expectedOrderFormSections:o},this._updateOrderForm({url:this._getBundleItemAttachmentURL(t,e,r),type:"DELETE",data:JSON.stringify(n)})},t.prototype.addDiscountCoupon=function(t,e){var r;return null==e&&(e=this._allOrderFormSections),r={text:t,expectedOrderFormSections:e},this._updateOrderForm({url:this._getAddCouponURL(),data:JSON.stringify(r)})},t.prototype.setCustomData=function(t){var e;return e={value:t.value},this._updateOrderForm({type:"PUT",url:this._getCustomDataUrl({app:t.app,field:t.field}),data:JSON.stringify(e)})},t.prototype.removeDiscountCoupon=function(t){return this.addDiscountCoupon("",t)},t.prototype.removeGiftRegistry=function(t){var e;return null==t&&(t=this._allOrderFormSections),e={expectedOrderFormSections:t},this._updateOrderForm({url:this._getRemoveGiftRegistryURL(),data:JSON.stringify(e)})},t.prototype.calculateShipping=function(t){return this.sendAttachment("shippingData",{address:t})},t.prototype.simulateShipping=function(){var t,e,r,i,o,n,s;return e=null,t=(o=[arguments[2],arguments[3]])[0],r=o[1],e=Array.isArray(arguments[0])?(console.warn("Calling simulateShipping with a list of items and postal code is deprecated.\nCall it with shippingData and orderFormId instead."),{items:(n=[arguments[0],arguments[1]])[0],postalCode:n[1],country:t}):{shippingData:(s=[arguments[0],arguments[1]])[0],orderFormId:s[1],country:t},i="",r&&(i="?sc="+r),this.ajax({url:this._getSimulationURL()+i,type:"POST",contentType:"application/json; charset=utf-8",dataType:"json",data:JSON.stringify(e)})},t.prototype.getAddressInformation=function(t){return this.ajax({url:this._getPostalCodeURL(t.postalCode,t.country),type:"GET",timeout:2e4})},t.prototype.getProfileByEmail=function(t,e){return null==e&&(e=1),this.ajax({url:this._getProfileURL(),type:"GET",data:{email:t,sc:e}})},t.prototype.startTransaction=function(t,e,r,i,o,n,s,a){var d;return null==i&&(i=!1),null==n&&(n=this._allOrderFormSections),d={referenceId:this._getOrderFormId(),savePersonalData:i,optinNewsLetter:o,value:t,referenceValue:e,interestValue:r,expectedOrderFormSections:n,recaptchaKey:s,recaptchaToken:a},this._updateOrderForm({url:this._startTransactionURL(),data:JSON.stringify(d)})},t.prototype.getOrders=function(t){return this.ajax({url:this._getOrdersURL(t),type:"GET",contentType:"application/json; charset=utf-8",dataType:"json"})},t.prototype.clearMessages=function(t){var e;return null==t&&(t=this._allOrderFormSections),e={expectedOrderFormSections:t},this.ajax({url:this._getOrderFormURL()+"/messages/clear",type:"POST",contentType:"application/json; charset=utf-8",dataType:"json",data:JSON.stringify(e)})},t.prototype.removeAccountId=function(t,e){var r;return null==e&&(e=this._allOrderFormSections),r={expectedOrderFormSections:e},this._updateOrderForm({url:this._getOrderFormURL()+"/paymentAccount/"+t+"/remove",data:JSON.stringify(r)})},t.prototype.getLogoutURL=t.prototype.getChangeToAnonymousUserURL=function(){return r+"/checkout/changeToAnonymousUser/"+this._getOrderFormId()},t.prototype.replaceSKU=function(t,e,r){return null==e&&(e=this._allOrderFormSections),null==r&&(r=!0),this._updateOrderForm({url:this._getAddToCartURL(),type:"PATCH",data:JSON.stringify({orderItems:t,expectedOrderFormSections:e,noSplitItem:!r})})},t.prototype._getOrderFormId=function(){return this._getOrderFormIdFromURL()||this.orderFormId||this._getOrderFormIdFromCookie()||""},t.prototype._getOrderFormIdFromCookie=function(){var t;if("__ofid",void 0!==(t=i("checkout.vtex.com"))&&""!==t)return o(t,"__ofid")},t.prototype._getOrderFormIdFromURL=function(){return s("orderFormId")},t.prototype._getBaseOrderFormURL=function(){return r+"/api/checkout/pub/orderForm"},t.prototype._getOrderFormURL=function(){var t;if(""===(t=this._getOrderFormId()))throw new Error("This method requires an OrderForm. Use getOrderForm beforehand.");return this._getBaseOrderFormURL()+"/"+t},t.prototype._getOrderFormURLWithId=function(){var t;return(t=this._getOrderFormId())?this._getBaseOrderFormURL()+"/"+t:this._getBaseOrderFormURL()},t.prototype._getSaveAttachmentURL=function(t){return this._getOrderFormURL()+"/attachments/"+t},t.prototype._getAddOfferingsURL=function(t){return this._getOrderFormURL()+"/items/"+t+"/offerings"},t.prototype._getRemoveOfferingsURL=function(t,e){return this._getOrderFormURL()+"/items/"+t+"/offerings/"+e+"/remove"},t.prototype._getBundleItemAttachmentURL=function(t,e,r){return this._getOrderFormURL()+"/items/"+t+"/bundles/"+e+"/attachments/"+r},t.prototype._getItemAttachmentURL=function(t,e){return this._getOrderFormURL()+"/items/"+t+"/attachments/"+e},t.prototype._getChangeOrdinationURL=function(){return this._getOrderFormURL()+"/itemsOrdination"},t.prototype._getCustomDataUrl=function(t){return this._getOrderFormURL()+"/customData/"+t.app+"/"+t.field},t.prototype._getAddCouponURL=function(){return this._getOrderFormURL()+"/coupons"},t.prototype._startTransactionURL=function(){return this._getOrderFormURL()+"/transaction"},t.prototype._getUpdateItemURL=function(){return this._getOrderFormURL()+"/items/update/"},t.prototype._getCloneItemURL=function(t){return this._getOrderFormURL()+"/items/"+t+"/clone"},t.prototype._getUpdateSelectableGifts=function(t){return this._getOrderFormURL()+"/selectable-gifts/"+t},t.prototype._getRemoveGiftRegistryURL=function(){return this._getBaseOrderFormURL()+"/giftRegistry/"+this._getOrderFormId()+"/remove"},t.prototype._getAddToCartURL=function(){return this._getOrderFormURL()+"/items"},t.prototype._manualPriceURL=function(t){return this._getOrderFormURL()+"/items/"+t+"/price"},t.prototype._getOrdersURL=function(t){return r+"/api/checkout/pub/orders/order-group/"+t},t.prototype._getSimulationURL=function(){return r+"/api/checkout/pub/orderForms/simulation"},t.prototype._getPostalCodeURL=function(t,e){return null==t&&(t=""),null==e&&(e="BRA"),r+"/api/checkout/pub/postal-code/"+e+"/"+t},t.prototype._getProfileURL=function(){return r+"/api/checkout/pub/profiles/"},t.prototype._getGatewayCallbackURL=function(){return r+"/checkout/gatewayCallback/{0}/{1}/{2}"},t.prototype._getFinishTransactionURL=function(t){return r+"/api/checkout/pub/gatewayCallback/"+t},t}(),window.vtexjs||(window.vtexjs={}),window.vtexjs.Checkout=t,window.vtexjs.checkout=new window.vtexjs.Checkout}.call(this);
//# sourceMappingURL=vtex.min.js.map