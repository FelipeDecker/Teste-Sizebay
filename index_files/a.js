function xcnttrack(t){var e=document,r=window;if(e.body){var o,a,n=(new Date).getTimezoneOffset();a=e.location.href,o=e.location.hostname;var c="xcnt_product_",i="xcnt_basket_",d="xcnt_order_",_="xcnt_user_",s="xcnt_transport_",u="xcnt_accomodation_",p="xcnt_tour_",h="//x.cnt.my/px/?r="+Math.random()+y("dom","dom",{dom:o})+"&tz="+n+"&sw="+screen.width+"&sh="+screen.height+"&ow="+window.outerWidth+"&oh="+window.outerHeight+"&iw="+window.innerWidth+"&ih="+window.innerHeight+"&scd="+(screen.colorDepth?screen.colorDepth:screen.pixelDepth)+y("sgm","xcnt_segment",r,t)+y("p_id",c+"id",r,t)+y("p_category",c+"category",r,t)+y("b_products",i+"products",r,t)+y("b_quantity",i+"quantity",r,t)+y("b_append",i+"append",r,t)+y("o_id",d+"id",r,t)+y("o_products",d+"products",r,t)+y("o_quantity",d+"quantity",r,t)+y("o_total",d+"total",r,t)+y("o_cur",d+"currency",r,t)+y("u_email",_+"email",r,t)+y("u_email_hash",_+"email_hash",r,t)+y("u_id",_+"id",r,t)+y("u_phone",_+"phone",r,t)+y("sa1",_+"sa",r,t)+y("t_t",s+"type",r,t)+y("t_company",s+"company",r,t)+y("t_from",s+"from",r,t)+y("t_to",s+"to",r,t)+y("t_dtdep",s+"depart_date",r,t)+y("t_dtret",s+"return_date",r,t)+y("t_dur",s+"duration",r,t)+y("t_cur",s+"currency",r,t)+y("t_prc",s+"price",r,t)+y("t_adu",s+"adults",r,t)+y("t_chi",s+"children",r,t)+y("t_chiage",s+"children_age",r,t)+y("t_class",s+"class",r,t)+y("a_t",u+"type",r,t)+y("a_loc",u+"location",r,t)+y("a_id",u+"id",r,t)+y("a_dtin",u+"checkin_date",r,t)+y("a_dtout",u+"checkout_date",r,t)+y("a_dprc",u+"day_price",r,t)+y("a_cur",u+"currency",r,t)+y("a_adu",u+"adults",r,t)+y("a_chi",u+"children",r,t)+y("a_chiage",u+"children_age",r,t)+y("a_rooms",u+"rooms",r,t)+y("to_id",p+"id",r,t)+y("to_loc",p+"location",r,t)+y("to_dtstfr",p+"start_date_from",r,t)+y("to_dtstto",p+"start_date_to",r,t)+y("u",_+"data",r,t)+y("provider","xcnt_provider",r,t)+y("ifr","ifr",{ifr:function(){try{return r.self!==r.top}catch(t){return!0}}()?"1":""})+y("url","url",{url:a})+y("ref","ref",{ref:e.referrer}),m=e.createElement("img");if(m.id="xcnt-img-"+Math.random(),m.width="0",m.height="0",m.style.cssText="display:none !important;width:0 !important;height:0 !important;",m.src=(-1==h.indexOf("u_email")?"":"https:")+h.substr(0,2048),null==e.getElementById("xcnt-pars")){var l=e.createElement("script");l.id="xcnt-pars",l.async=1,l.src="//x.cnt.my/async/parser/"+o+".js?r=4.00"+y("dom","dom",{dom:o}),e.body.appendChild(l)}function y(t,e,r,o){var a="";return void 0!==o?void 0!==o[e]&&""!=o[e]&&(a=o[e]):void 0!==r[e]&&""!=r[e]&&(a=r[e]),""!=a?"&"+t+"="+encodeURIComponent(a):""}}}xcnttrack();