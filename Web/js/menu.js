var serialPort = "COM1";
var serialWeb = 8080;
var serialTimeout = 12000;
var serialWDomain = "http://" + window.location.hostname;

$.ajax({
  url: "version.txt",
  success: function(data) {
    document.title = "Inverter Console (Build " + data + ")"
  }
});

$.ajax({
  url: "js/serial.json",
  dataType: "json",
  async: false,
  success: function(data) {
    serialPort = data.serial.port;
    serialWeb = data.serial.web;
	serialTimeout = data.serial.timeout * 1100;
  }
});

$(document).ready(function () {

    alertify.defaults.transition = "slide";
    alertify.defaults.theme.ok = "btn btn-primary";
    alertify.defaults.theme.cancel = "btn btn-danger";
    alertify.defaults.theme.input = "form-control";

    alertify.dialog('startInverterMode', function () {
        return {
            setup: function setup() {
                return {
                    buttons: [{
                        text: '(1) Start Auto',
                        className: alertify.defaults.theme.ok
                    },{
                        text: '(2) Manual Run',
                        className: alertify.defaults.theme.ok
                    },{
                        text: '(5) Sine Wave',
                        className: alertify.defaults.theme.ok
                    },{
                        text: '(3) Boost',
                        className: alertify.defaults.theme.cancel
                    },{
                        text: '(4) Buck',
                        className: alertify.defaults.theme.cancel
                    }],
                    focus: {
                        //element: 0,
                        select: false
                    },
                    options: {
                        title: 'Inverter Mode',
                        maximizable: false,
                        resizable: false,
                        autoReset: true
                    }
                };
            },
            callback:function(closeEvent){

                //0=Off, 1=Run, 2=ManualRun, 3=Boost, 4=Buck, 5=Sine, 6=AcHeat
                getJSONFloatValue('potnom', function(potnom) {
                    if (potnom > 20) {
                        alertify.alert("High RPM Warning", "Adjust your Potentiometer down to zero before starting Inverter.", function () {
                            alertify.message('OK');
                        });
                    } else {
                        if(closeEvent.index === 0) {
                            startInverter(1);
                        }else if(closeEvent.index === 1) {
                            startInverter(2);
                        }else if(closeEvent.index === 2) {
                            startInverter(5);
                        }else if(closeEvent.index === 3) {
                            $.notify({ message: "Experimental Area" }, { type: 'danger' });
                            startInverter(3);
                            setParameter("chargemode", 3, false, true);
                        }else if(closeEvent.index === 4) {
                            $.notify({ message: "Experimental Area" }, { type: 'danger' });
                            startInverter(4);
                            setParameter("chargemode", 4, false, true);
                        }

                        if(closeEvent.index === 2 || closeEvent.index === 3) {
                            if(getJSONFloatValue("chargecur") === 0) {
                                alertify.prompt("Current Limit", "Enter Charge Current Limit (A)", "", function (event, input) {
                                    setParameter("chargecur", input, true, true);
                                }, function () {});
                            }
                        }
                    }
                });
            },
            hooks: {
                onshow: function() {
                    //console.log(this);
                    this.elements.dialog.style.maxWidth = 'none';
                    this.elements.dialog.style.width = '640px';
                }
            }
        };
    }, false, 'confirm');

    buildMenu();

    getJSONFloatValue("version", function(version) {
        if(version > 0) {
            $("#firmwareVersion").empty().append("Firmware v" + version);
            if(version < 3.59)
            {
                $.notify({ message: 'Firmware Update Recommended!' }, { type: 'danger' });
            }
        }
    });
	
	/*
    TipRefreshTimer=setTimeout(function () {
		clearTimeout(TipRefreshTimer);
        buildTips();
    }, 1000);
	*/
});

function isInt(n){
    return Number(n) === n && n % 1 === 0;
};

function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
};

function checkSoftware(app){

    $.ajax("install.php?check=" + app, {
        success: function success(data) {
            console.log(data);
            eval(data);
        }
    });
};

function validateInput(id, value, callback)
{
    getJSONFloatValue('opmode', function(opmode) {
        if(opmode > 0 && id != 'fslipspnt') {
            stopInverter();
            $.notify({ message: 'Inverter must not be in operating mode.' }, { type: 'danger' });
            callback(false);
            return;
        }else{
            if (isInt(parseInt(value)) == false && isFloat(parseFloat(value)) == false){
                $.notify({ message: id + ' Value must be a number' }, { type: 'danger' });
                callback(false);
                return;
            }else if(id == 'fmin'){
                if(parseFloat(value) > parseFloat(inputText('#fslipmin')))
                {
                    $.notify({ message: 'Should be set below fslipmin' }, { type: 'danger' });
                    callback(false);
                    return;
                }
            }else  if(id == 'polepairs'){
                if ($.inArray(parseInt(value), [ 1, 2, 3, 4, 5]) == -1)
                {
                    $.notify({ message: 'Pole pairs = half # of motor poles' }, { type: 'danger' });
                    callback(false);
                    return;
                }
            }else  if(id == 'udcmin'){
                if(parseInt(value) > parseInt(inputText("#udcmax")))
                {
                    $.notify({ message: 'Should be below maximum voltage (udcmax)' }, { type: 'danger' });
                    callback(false);
                    return;
                }
            }else  if(id == 'udcmax'){
                if(parseInt(value) > parseInt(inputText("#udclim")))
                {
                    $.notify({ message: 'Should be lower than cut-off voltage (udclim)' }, { type: 'danger' });
                    callback(false);
                    return;
                }
            }else  if(id == 'udclim'){
                if(parseInt(value) <= parseInt(inputText("#udcmax")))
                {
                    $.notify({ message: 'Should be above maximum voltage (udcmax)' }, { type: 'danger' });
                    callback(false);
                    return;
                }
            }else if(id == 'udcsw'){
                if(parseInt(value) > parseInt(inputText("#udcmax")))
                {
                    $.notify({ message: 'Should be below maximum voltage (udcmax)' }, { type: 'danger' });
                    callback(false);
                    return;
                }
            }else if(id == 'udcsw'){
                if(parseInt(value) > parseInt(inputText("#udcmin")))
                {
                    $.notify({ message: 'Should be below minimum voltage (udcmin)' }, { type: 'danger' });
                    callback(false);
                    return;
                }
            }else if(id == 'fslipmin'){
                if(parseFloat(value) <= parseFloat(inputText('#fmin')))
                {
                    $.notify({ message: 'Should be above starting frequency (fmin)' }, { type: 'danger' });
                    callback(false);
                    return;
                }
            /*
            }else  if(id == 'ocurlim'){
                if(value > 0)
                {
                    return 'Current limit should be set as negative';
                }*/
            }

            var notify = $.notify({ message: id + " = " + $.trim(value) },{
                //allow_dismiss: false,
                //showProgressbar: true,
                type: 'warning'
            });
            callback(true);
        }
    });
};

function setParameter(cmd, value, save, notify) {

    var e = "";

    $.ajax(serialWDomain + ":" + serialWeb + "/serial.php?pk=1&name=" + cmd + "&value=" + value, {
        //async: true,
		timeout: serialTimeout,
        success: function success(data) {
            e = data;

            if(save) {

                var data = sendCommand("save");
            
                if(notify) {

                    if(data.indexOf("Parameters stored") != -1)
                    {
                        //TODO: CRC32 check on entire params list

                        $.notify({ message: data },{ type: 'success' });
                    }else{
                        $.notify({ icon: 'glyphicon glyphicon-warning-sign', title: 'Error', message: data },{ type: 'danger' });
                    }
                }
            }
        }
    });

    //console.log(e);
    return e;
};

function sendCommand(cmd) {

    var e = ""

    $.ajax(serialWDomain + ":" + serialWeb + "/serial.php?command=" + cmd, {
        async: false,
        cache: false,
        timeout: serialTimeout,
        success: function success(data) {
            if(cmd == "json") {
                try {
                    e = JSON.parse(data);
                } catch(ex) {
                    e = {};
                    $.notify({ message: ex + ":" + data }, { type: 'danger' });
                }
            }else{
                e = data;
            }
        },
        error: function error(xhr, textStatus, errorThrown) {}
    });
    //console.log(e);
    return e;
};

function downloadSnapshot() {
    window.location.href = "snapshot.php";
};

function uploadSnapshot() {
    $('.fileUpload').trigger('click');
};

function openExternalApp(app) {

    //console.log(app);
    
    if (app === "openscad") {
        $('.fileSVG').trigger('click');
    } else if (app === "openocd") {
        window.location.href = "bootloader.php";
    } else if (app === "source") {
        window.location.href = "sourcecode.php";
    } else if (app === "attiny") {
        window.location.href = "attiny.php";
    } else {
        $.ajax("open.php?app=" + app);
    }
};

function getJSONFloatValue(value, callback) {

    var f = 0;
    var sync = false;

    if(callback)
        sync = true;

    $.ajax(serialWDomain + ":" + serialWeb + "/serial.php?get=" + value, {
        async: sync,
        timeout: serialTimeout,
        success: function success(data) {
            f = parseFloat(data);
            if(isNaN(f))
                f = 0;
            if(callback)
                callback(f);
        }
    });
    //console.log(f);
    return f;
};

function getJSONAverageFloatValue(value,c) {
    if(!c)
        c = "average"; //median
    var f = 0;
    $.ajax(serialWDomain + ":" + serialWeb + "/serial.php?" + c + "=" + value, {
        async: false,
		timeout: serialTimeout,
        success: function success(data) {
            f = parseFloat(data);
        }
    });
    //console.log(f);
    return f;
};

function startInverter(mode) {

    var data = sendCommand("start " + mode);
    //console.log(data);

    if (data.indexOf("started") != -1) {
        $.notify({ message: "Inverter started" }, { type: "success" });
        /*
        if (mode === 2 || mode === 5) {
            $("#potentiometer").show();
            $(".collapse").collapse('show');
        }
        */
    } else {
        $.notify({
            icon: "glyphicon glyphicon-warning-sign", title: "Error", message: data
        }, {
            type: "danger"
        });
    }
};

function stopInverter() {

    var data = sendCommand("stop");
    //console.log(data);

    if (data.indexOf("halted") != -1) {
        $.notify({ message: "Inverter Stopped"}, { type: "danger" });
        setParameter("chargemode", "0", false, false);
    } else {
        $.notify({
            icon: "glyphicon glyphicon-warning-sign", title: "Error", message: data
        }, {
            type: "danger"
        });
    }
    $(".collapse").collapse();

    /*
    setTimeout(function () {
        $("#potentiometer").hide();
        //location.reload();
    }, 1000);
    */
};

function setDefaults() {

    alertify.confirm('', 'Reset all settings back to default.', function () {

        sendCommand("can clear");
        $.ajax("can.php?clear=1");

        var data = sendCommand("defaults");
        //console.log(data);

        if (data.indexOf("Defaults loaded") != -1) {
            sendCommand("save");
            $.notify({ message: "Inverter reset to Default" }, { type: "success" });
        } else {
            $.notify({
                icon: "glyphicon glyphicon-warning-sign", title: "Error", message: data
            }, {
                type: "danger"
            });
        }

        setTimeout(function () {
            window.location.href = "index.php";
        }, 2000);

    }, function () {});
};

function giveCredit(csv) {
    $.ajax(csv, {
        success: function success(data) {

            var name = "";
            var url = "";

            if (data.indexOf(",") != -1) {
                var s = data.split(",");
                name = s[0];
                url = "<br/><a href='" + s[1] + "' target=_blank>Project Website</a>";
            }else{
                name = data;
            }
            $.notify({ message: "Designed By: " + name + url }, { type: 'success' });
        }
    });
};

function buildTips() {
    
    if(os === "mobile")
        return;

    var show = Math.random() >= 0.5;

    if (show === true) {

        var opStatus = $("#opStatus");

        $.ajax("tips.csv", {
            //async: false,
            success: function success(data) {
                var row = data.split("\n");
                var n = Math.floor(Math.random() * row.length);

                for (var i = 0; i < row.length; i++) {
                    if (i === n) {
                        img = $("<img>", { class: "iconic", "data-src": "img/idea.svg", "data-toggle": "tooltip", "data-html": "true", "title": "<h8>Tip: " + row[i] + "</h8>" });
                        opStatus.append(img);
                        break;
                    }
                }

                $('[data-toggle="tooltip"]').tooltip();
            },
            error: function error(xhr, textStatus, errorThrown) {}
        });
    }
};

function buildMenu() {

    var file = "js/menu.json";

    if (os === "mobile") {
        file = "js/menu-mobile.json";
    }

    $.ajax(file, {
        dataType: 'json',
        success: function success(json) {

            //console.log(json);

            var nav = $("#buildNav").empty();
            var div = $("<div>", { class: "collapse navbar-collapse", id:"navbarsDefault" });
            var container = $("<table>", { style: "width:100%;" });
            var row = $("<tr>");
            var col = $("<td>");

            if (os === "mobile") {
                
                var button = $("<button>", { class: "navbar-toggler navbar-toggler-right", type: "button", "data-toggle":"collapse", "data-target": "#navbarsDefault", "aria-controls": "navbarsDefault", "aria-expanded": false, "aria-label": "Navigation" });
                var span = $("<span>", { class: "text-white display-3 glyphicon glyphicon-menu-hamburger" });
                button.append(span);
                col.append(button);
     
                nav.addClass("navbar-toggleable-md navbar-inverse bg-inverse");
                nav.attr("style","background-color: #000;");
            }else{

                nav.addClass("navbar-expand-md navbar-light bg-light");
            }

            col.append(div);
            row.append(col);
            container.append(row);
            nav.append(container);

            for(var key in json.menu)
            {
                //console.log(json.menu[key].id);

                var ul = $("<ul>", { class: "navbar-nav" });
                var li = $("<li>", { class: "nav-item" });
                var a = $("<a>", { class: "nav-link bg-inverse", href: "#" });
                var _i = $("<i>", { class: "glyphicon " +  json.menu[key].icon });
                
                a.append(_i);
                a.append($("<b>").append(" " + json.menu[key].id));
                li.append(a);
                
                if(json.menu[key].dropdown)
                {
                    li.addClass("dropdown");
                    a.addClass("dropdown-toggle");
                    a.attr("data-toggle","dropdown");
                    a.attr("aria-haspopup",true);
                    a.attr("aria-expanded",false);

                    var dropdown_menu = $("<div>", { class: "dropdown-menu" });

                    for(var d in json.menu[key].dropdown)
                    {
                        //console.log(json.menu[key].dropdown[d].id);
                        var dropdown_id = json.menu[key].dropdown[d].id;

                        var onclick = json.menu[key].dropdown[d].onClick;
                        if(onclick == undefined) {

                            var d = $("<div>", { class: "dropdown-divider" });
                            dropdown_menu.append(d);
                        }else{
                            
                            var dropdown_item = $("<a>", { class: "dropdown-item", href: "#" });

                            var icon = $("<i>", { class: "glyphicon " + json.menu[key].dropdown[d].icon });
                            var item = $("<span>");

                            if (onclick.indexOf("/") != -1 && onclick.indexOf("alertify") == -1)
                            {
                                dropdown_item.attr("href", onclick);
                            }else{
                                dropdown_item.attr("onClick", onclick);
                            }

                            dropdown_item.append(icon);
                            dropdown_item.append(item.append(" " + dropdown_id));
                            dropdown_menu.append(dropdown_item);
                        }

                        if (os === "mobile") {
                            icon.addClass("display-3");
                            item.addClass("display-3");
                        }
                    }

                    li.append(dropdown_menu);
                }else{
                    a.attr("href", json.menu[key].onClick);
                }

                if (os === "mobile") {
                    a.addClass("display-4 text-white");
                }

                ul.append(li);
                div.append(ul);
            }

            var status = $("<div>", { id: "opStatus" });
            var col = $("<td>");
            col.append(status);
            row.append(col);

            var span = $("<span>", { class: "badge badge-info float-right", id: "firmwareVersion" });
            var col = $("<td>");
            col.append(span);
            row.append(col);

            if(os === "mobile") {
                span.attr("style","font-size: 125%;");
            }
        }
    });
};

function deleteCookie(name, path, domain) {

  if(getCookie(name)) {
    document.cookie = name + "=" +
      ((path) ? ";path="+path:"")+
      ((domain)?";domain="+domain:"") +
      ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
  }
};

function setCookie(name, value, exdays) {

    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + (exdays == null ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = name + "=" + c_value;
};

function getCookie(name) {
    
    var i,
        x,
        y,
        ARRcookies = document.cookie.split(";");

    for (var i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == name) {
            return unescape(y);
        }
    }
};