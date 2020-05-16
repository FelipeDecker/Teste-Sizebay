
function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}

  function send() {
        if($("#nome").val() == "" || $("#sobrenome").val() == "" || $("#email").val() == "" || $("#phone").val() == ""){
            $('#mensagem').html('Preencha todos os campos');
            setTimeout(function(){
                $('#mensagem').html("");
            }, 3000);
            return false
        }
        
        var usuario = {
            "firstName": $("#nome").val(),
            "lastName": $("#sobrenome").val(),
            "email":$("#email").val(),
            "phone":$("#phone").val(),
            "isNewsletterOptIn": true
        }

        $('#mensagem').html('Enviando...');

        $.ajax({
            url: '/api/dataentities/NW/documents',
            type: 'put',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data, textStatus, xhr) {
                $(".etapa1").hide()
                $(".etapa2").show()
                //$('#mensagem').html("Você foi cadastrada com sucesso! (" + xhr.status+")");
            },
            data: JSON.stringify(usuario)
        });
    }

$(document).ready(function(){
 
     if(getCookie("VtexRCRequestCounter") == 1 || getCookie("VtexRCRequestCounter") == undefined){
        $(".newsletter").fadeIn();
        console.log("apareceu")
     }else{
        $(".newsletter").hide();
        console.log("sumiu")
     }

    $(document).on("click",".newsletter button",function(){
    	send();
    });
    $(document).on("click",".background-newsletter, .fechar, .ir-para-o-site",function(){
    	$(".newsletter").hide();
    });
});