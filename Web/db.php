<!DOCTYPE html>
<html>
    <head>
        <?php
            include "header.php";
        ?>
        <script type="text/javascript" src="/js/db.js"></script>
    </head>
    <body>
        <div class="container">
            <?php include "menu.php" ?>
            <br/>
            <div class="row">
                <div class="col">
                    <table class="table table-active bg-light table-bordered">
                        <tr align="center">
                            <td>
                                <h2>Motor Configuraton Database</h2>
                                <br/>
                                <div class="input-group">
                                    <span class = "input-group-addon w-75">
                                        <select class="form-control" onchange="setMotorImage()" id="motor"></select>
                                    </span>
                                    <span class = "input-group-addon w-25">
                                        <button class="browse btn btn-primary" type="button"><i class="icon-list-alt"></i> Select Motor</button>
                                    </span>
                                </div>
                                <br/><br/>
                                <div class="input-group">
                                    <span class = "input-group-addon w-50">
                                        <img src="" id="motorimage" class="rounded pull-left w-75">
                                    </span>
                                    <span class = "input-group-addon align-text-top pull-left">
                                        <ul class="text-left" id="motorinfo"></ul>
                                        <br/>
                                        <div id="motortune"></div>
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    </body>
</html>