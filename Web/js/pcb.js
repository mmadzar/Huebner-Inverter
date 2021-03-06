/*
E6    20% tolerance
E12   10% tolerance
E24   5% tolerance
E48   2% tolerance
E96   1% tolerance
E192  0.5, 0.25, 0.1% tolerances
*/

function buildTable(title, csv, notes) {

    $.ajax(csv, {
        //async: false,
        beforeSend: function beforeSend(req) {
            req.overrideMimeType('text/plain; charset=x-user-defined');
        },
        success: function success(data) {
            var div = $("#components");
            var header = $("<table>", { class: "table table-active bg-light table-bordered", style: "padding-left:10px;" }).append($("<h4>").append(title));
            var label = $("<span>", { class: "badge badge-lg badge-warning" }).append(notes);
            var table = $("<table>", { class: "table table-active bg-light table-bordered table-striped table-hover" });
            var thead = $("<thead>", { class: "thead-inverse" }).append($("<tr>").append($("<th>").append("Part")).append($("<th>").append("Value")).append($("<th>").append("Manual")));
            var tbody = $("<tbody>");

            var bom = csv.substring(0, csv.lastIndexOf("/"));
            var row = data.split("\n");

            console.log(csv);
            console.log(bom);

            for (var i = 1; i < row.length; ++i) {
                var split = row[i].split(",");

                if (split.length > 4) {
                    if (split[0].length > 1) {
                        if (split[3].indexOf("PINHD") == -1 || split[0].indexOf("JP1") != -1 || split[0].indexOf("JP2") != -1) {

                            var a = $("<button>", { class: "btn" }).append("PDF");
                            var pdf = "";

                            //Find pdf value
                            for (p = 4; p < 8; p++) {
                                if(split[p] != undefined)
                                    if (split[p].indexOf("http") != -1 || split[p].indexOf("pdf") != -1) {
                                        pdf = split[p];
                                        break;
                                    }
                            }
                            
                            if (pdf != "") {
                                //a = $("<button>", { id:split[4], class:"btn btn-primary", "data-toggle":"modal", "data-target":"#myModal" }).append("PDF");
                                a = $("<button>", { id: split[4], class: "btn btn-primary" }).append("PDF");
                                a.on('click', function (event) {
                                    //console.log(event.target.id);
                                    //$("#componentPDF").attr('src', event.target.id);
                                    window.open(event.target.id, '_blank');
                                });
                            }

                            var value = split[2].replace("", "u").replace("**", "").replace("*", "").replace("\"", "");

                            if (value.length < 1) {
                                value = split[3].replace("u", "&#181;");
                            }

                            var tr = $("<tr>");
                            var td1 = $("<td>");
                            var td2 = $("<td>");
                            var td3 = $("<td>");

                            var img = value.replace(" ", "").replace("1%", "");
                            if (img.indexOf("/") != -1) {
                                var s = img.split("/");
                                img = s[0];
                            }
                            if (split[0].indexOf("RN") != -1) img = "RN_" + img;

                            var span = $("<span>", { "data-toggle": "tooltip", "title": "<img src='" + bom + "/img/" + img + ".jpg'>"});
                            span.append(value);
                            td2.append(span);
                            tbody.append(tr.append(td1.append(split[0])).append(td2).append(td3.append(a)));
                        }
                    }
                }
            }

            table.append(thead);
            table.append(tbody);
            div.append(header);
            if (notes) div.append(label);
            div.append(table);

            $('[data-toggle="tooltip"]').tooltip({
                animated: 'fade',
                //placement: 'bottom',
                html: true
            });
        },
        error: function error(xhr, textStatus, errorThrown) {}
    });
};