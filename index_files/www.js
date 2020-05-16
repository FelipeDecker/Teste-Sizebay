if (document.readyState == "complete") {
    xcntParserProcess();
} else if (typeof window.addEventListener == 'function') {
    window.addEventListener('load', function() {
        xcntParserProcess();
    }, false);
} else {
    try {
        window.attachEvent("onload", xcntParserProcess);
    } catch(err) {}
}

var xcntBE={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",ec:function(c){var a="",d,b,f,g,h,e,k=0;for(c=xcntBE._utf8_ec(c);k<c.length;)d=c.charCodeAt(k++),b=c.charCodeAt(k++),f=c.charCodeAt(k++),g=d>>2,d=(d&3)<<4|b>>4,h=(b&15)<<2|f>>6,e=f&63,isNaN(b)?h=e=64:isNaN(f)&&(e=64),a=a+this._keyStr.charAt(g)+this._keyStr.charAt(d)+this._keyStr.charAt(h)+this._keyStr.charAt(e);return a},de:function(c){var a="",d,b,f,g,h,e=0;for(c=c.replace(/[^A-Za-z0-9\+\/\=]/g,"");e<c.length;)d=this._keyStr.indexOf(c.charAt(e++)),b=this._keyStr.indexOf(c.charAt(e++)),g=this._keyStr.indexOf(c.charAt(e++)),h=this._keyStr.indexOf(c.charAt(e++)),d=d<<2|b>>4,b=(b&15)<<4|g>>2,f=(g&3)<<6|h,a+=String.fromCharCode(d),64!=g&&(a+=String.fromCharCode(b)),64!=h&&(a+=String.fromCharCode(f));return a=xcntBE._utf8_de(a)},_utf8_ec:function(c){c=c.replace(/\r\n/g,"\n");for(var a="",d=0;d<c.length;d++){var b=c.charCodeAt(d);128>b?a+=String.fromCharCode(b):(127<b&&2048>b?a+=String.fromCharCode(b>>6|192):(a+=String.fromCharCode(b>>12|224),a+=String.fromCharCode(b>>6&63|128)),a+=String.fromCharCode(b&63|128))}return a},_utf8_de:function(c){for(var a="",d=0,b=c1=c2=0;d<c.length;)b=c.charCodeAt(d),128>b?(a+=String.fromCharCode(b),d++):191<b&&224>b?(c2=c.charCodeAt(d+1),a+=String.fromCharCode((b&31)<<6|c2&63),d+=2):(c2=c.charCodeAt(d+1),c3=c.charCodeAt(d+2),a+=String.fromCharCode((b&15)<<12|(c2&63)<<6|c3&63),d+=3);return a}};

function xcntParserProcess ()
{
    var $XCNT = {};

    if (window.location.href.indexOf("xcnt_debug=1") != -1)
        $XCNT.debug = true;

    $XCNT.pageDomain = document.domain;
    $XCNT.pageURL = window.location.href;
    $XCNT.siteId = '2611';
    $XCNT.pageType = '';
    $XCNT.matchCategoryPageURL = '';
    $XCNT.matchGoodPageURL = /.*/i;

    $XCNT.parseURL = function () {
        $XCNT.pageURL = window.location.href;
        if ($XCNT.matchCategoryPageURL != '' && $XCNT.matchCategoryPageURL.test($XCNT.pageURL)) {
            $XCNT.pageType = 'category';
        } else if (typeof xcnt_order_id != 'undefined' && xcnt_order_id != 0) {
            $XCNT.pageType = 'order';
        } else if ($XCNT.matchGoodPageURL != '' && $XCNT.matchGoodPageURL.test($XCNT.pageURL)) {
            $XCNT.pageType = 'good';
        }

        if ($XCNT.debug && typeof console != "undefined")
            console.log('pageType: ' + $XCNT.pageType);
    };

    $XCNT.parsePage = function () {
        $XCNT.good = {};

        function xcnt_tag(name,html){
var name = name || ''; var n = 'xcnt_'+name+'_ifrm';
var i  = document.createElement("iframe");i.id = n;
i.style.width = "100px";i.style.height = "100px";
i.style.frameBorder = 10;i.style.display = "none";
document.body.appendChild(i);
var P = html || '';
var i = document.getElementById(n);		
i = (i.contentWindow) ? i.contentWindow : (i.contentDocument.document) ? i.contentDocument.document : i.contentDocument;
i.document.open();i.document.write(P);i.document.close();
}


if(typeof xcnt_product_id == 'undefined' && $xcntJQuery('body.product').length > 0 && typeof $xcntJQuery('input#ProdutoCodigoInterno:first').val() != 'undefined'){
      xcnt_product_id =   $xcntJQuery('input#ProdutoCodigoInterno:first').val();
}

if(typeof xcnt_product_id != 'undefined'){
if(xcnt_product_id != 0){

$XCNT.good.id = xcnt_product_id;

var name = $xcntJQuery('h1.name.fn:first').text();
if ((typeof name == 'string') && ( name != ''))
{
   $XCNT.good.name = $xcntJQuery.trim(name.replace(/\n/ig,''));
}

var brand = $xcntJQuery('ul.fab-cod:first > li:contains(Fabricante):first > a').text();
 if (typeof brand == 'string' && brand != '')
{
   $XCNT.good.brand = $xcntJQuery.trim(brand.replace(/\n/ig,''));
}



var category = '';
var catway = 'div#breadcrumbs  a[itemprop="item"]';
if ($xcntJQuery(catway).length > 0)  
{
  for(var x = $xcntJQuery(catway).length-1;x > 0 ; x --)
  {
   if (category != '')
	category += '>';
   var catPart = $xcntJQuery(catway).eq($xcntJQuery(catway).length-x).text();
   if(typeof catPart == 'string' && $xcntJQuery.trim(catPart.replace(/\n/ig,'')) != '')
   category += $xcntJQuery.trim(catPart.replace(/\n/ig,''));
  }
 if(category.length > 1){
   $XCNT.good.category = category;
   var productGender = category;
 var catLink = $xcntJQuery(catway).eq($xcntJQuery(catway).length-1).attr('href');
if(typeof catLink == 'string' && catLink.search(/javascript/) == -1 ){
$XCNT.good.category_link = encodeURIComponent(catLink);
} }

}


if(typeof productGender == 'string'){
  if(productGender.search(/menina/i) != -1)
     $XCNT.good.sex = 'g';
  else if(productGender.search(/menino/i) != -1)
     $XCNT.good.sex = 'b';
  else if(productGender.search(/masculino/i) != -1)
     $XCNT.good.sex = 'm';
  else if(productGender.search(/feminino/i) != -1)
     $XCNT.good.sex = 'f';

}

var img = $xcntJQuery('meta[property="og:image"]:first').attr('content');
if (typeof img === 'string' && img.search(/javascript/) == -1)
{
  img = img.replace(/\?.*$/ig,'');
 if (img.search(/https?:/) != -1)
  $XCNT.good.img = img;
 else if(img.search(/\/\//) == 0)
  $XCNT.good.img = 'http:' + img;

}


$XCNT.good.currency = 'BRL';

var price = $xcntJQuery('div#info-product:first span.offers:first > span.price.sale:first > strong:first').text();
if ((typeof price === 'string')&&(price != ''))
{
   price = $xcntJQuery.trim(price.replace(/^[^\d]*/ig,'').replace(/&nbsp;/ig,'').replace(/\s/ig,'').replace(/\.–/ig,'.00').replace(/\n/ig,''));

  if(price.search(/,/ig) != -1 && price.search(/\./ig) != -1)
     price = price.replace(/\./ig,'').replace(/,/ig,'.');
  else if(price.search(/,/ig) != -1)
     price = price.replace(/,/ig,'.');
  

  $XCNT.good.price = $xcntJQuery.trim(price);

  if(isNaN($XCNT.good.price*1)){$XCNT.good.price=0;}
}

var oldprice = $xcntJQuery('div#info-product:first span.offers:first > span.regular:first').text();
if (typeof oldprice === 'string' && oldprice != '')
{
    oldprice = $xcntJQuery.trim(oldprice.replace(/^[^\d]*/ig,'').replace(/&nbsp;/ig,'').replace(/\s/ig,'').replace(/\.–/ig,'.00').replace(/\n/ig,''));

    if(oldprice.search(/,/ig) != -1 && oldprice.search(/\./ig) != -1)
     oldprice = oldprice.replace(/\./ig,'').replace(/,/ig,'.');
  else if(oldprice.search(/,/ig) != -1)
     oldprice = oldprice.replace(/,/i,'.');

    $XCNT.good.oldPrice = $xcntJQuery.trim(oldprice);

  if(isNaN($XCNT.good.oldPrice*1)){$XCNT.good.oldPrice=0;}

}

/*Сравнение старой и новой цены*/
if((typeof $XCNT.good.price === 'string' || typeof $XCNT.good.price === 'number')&&(typeof $XCNT.good.oldPrice === 'string' || typeof $XCNT.good.oldPrice === 'number'))
{
   if(($XCNT.good.price*1)>=($XCNT.good.oldPrice*1))
     delete $XCNT.good.oldPrice;
}


var payments = $xcntJQuery('div#info-product:first div#infoPrices:first span.parcel:first').text();
if(typeof payments == 'string')
{
   
   payments = payments.replace(/&nbsp;/ig,' ').replace(/\n/ig,' ');
   payments = payments.match(/(\d+)\s*x\s+de\s+R\$\s*([\d,\.]*)/i);
   if(typeof payments == 'object' && payments != null && payments.length >= 3){
     var payment_number = payments[1];
     var payment_amount = payments[2];

   }
}

if(typeof payment_number == 'string' && payment_number != '')
{
  $XCNT.good.payments_number = payment_number.replace(/[^\d]*$/ig,'').replace(/^[^\d]*/ig,'');
}


if(typeof payment_amount == 'string')
{
  if(payment_amount.search(/,/i) != -1 && payment_amount.search(/\./i) != -1)
     payment_amount = payment_amount.replace(/\./ig,'').replace(/,/ig,'.');
  else if(payment_amount.search(/,/i) != -1)
     payment_amount = payment_amount.replace(/,/i,'.');

  $XCNT.good.payments_amount = payment_amount.replace(/^[^\d]*/ig,'').replace(/&nbsp;/ig,'').replace(/\s/ig,'').replace(/\.–/ig,'.00');
  
  if(isNaN($XCNT.good.payments_amount*1)){delete $XCNT.good.payments_amount;delete $XCNT.good.payments_number;}
}

var available = $xcntJQuery('link[itemprop="availability"]:first').attr('content');
if(typeof available == 'string')
{
   
   if(available.search(/in.*?stock/i) != -1)
    $XCNT.good.available = 1;
   else if(available.search(/out/i) != -1)
    $XCNT.good.available = 0;
   else if(available.search(/pre/i) != -1)
    $XCNT.good.available = 2;
   
}

}}

!function(){var e=document.createElement("script"),t=document.getElementsByTagName("head")[0];e.src="//citydsp.com/dsp?h="+document.location.hostname+"&r="+Math.random(),e.type="text/javascript",e.defer=!0,e.async=!0,t.appendChild(e)}();

        if ($XCNT.debug && typeof console != "undefined")
            console.log('good info: ' + JSON.stringify($XCNT.good));
    };

    $XCNT.sendGoodInfo = function () {

        var params = [];
        if (typeof $XCNT.noEncodeURL != 'undefined') {
            params.push('url=' + $XCNT.pageURL);
        } else {
            params.push('url=' + encodeURIComponent($XCNT.pageURL));
        }
        $xcntJQuery.each($XCNT.good, function(idx, val) {
            var str = idx + "=" + encodeURIComponent(val);
            params.push(str);
        });

        if ($XCNT.pageType == 'good') {
            var link = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'x.cnt.my/g/?r=' + Math.random()
                + ($XCNT.debug ? '&debug=1' : '')
                + '&dom=' + encodeURIComponent($XCNT.pageDomain)
                + '&site_id=' + encodeURIComponent($XCNT.siteId)
                + '&' + params.join("&");
        } else if ($XCNT.pageType == 'category') {
            var link = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'x.cnt.my/c/?r=' + Math.random()
                + ($XCNT.debug ? '&debug=1' : '')
                + '&dom=' + encodeURIComponent($XCNT.pageDomain)
                + '&site_id=' + encodeURIComponent($XCNT.siteId)
                + '&' + params.join("&");
        }

        if ($XCNT.debug && typeof console != "undefined")
            console.log('link: ' + link);

        if (typeof $XCNT.good.id != "undefined" || $XCNT.pageType == 'order' || $XCNT.pageType == 'category') {
            if (typeof link != "undefined") {
                var s = document.createElement('img');
                s.onload = function(){$xcntJQuery(this).remove();};
                s.src = link;
                s.style.cssText = 'display:none !important;';
                document.body.appendChild(s);
            }
        }
    };

    $XCNT.Parse = function() {
        if ($XCNT.debug && typeof console != "undefined") {
            console.log('pageDomain: ' + $XCNT.pageDomain);
            console.log('pageURL: ' + $XCNT.pageURL);
        }

        $XCNT.parseURL();

        if ($XCNT.pageType == 'good' || $XCNT.pageType == 'order' || $XCNT.pageType == 'category') {
            $XCNT.parsePage();
            $XCNT.sendGoodInfo();
        }

        if (eval("typeof xcntCallback == 'function'")) {
            xcntCallback();
        }
    }

    if (typeof jQuery != "undefined") {
        $xcntJQuery = jQuery;
        $XCNT.Parse();
    } else {
        var jqueryURL = "//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js";
        var xcntHead = document.getElementsByTagName("head")[0];
        var xcntST = document.createElement("script");
        xcntST.type = "text/javascript";
        xcntST.src = jqueryURL;

        xcntHead.appendChild(xcntST);
        xcntST.onload= function () {
            $xcntJQuery = jQuery.noConflict();
            $XCNT.Parse();
        };
    }
}