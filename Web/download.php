<?php
    session_start();

    include_once("common.php");
    
    $os = detectOS();
    $osclient = detectClientOS();
    $software = getSoftware();

    if(isset($_GET['start']) || isset($_GET['download'])){

        $id = $software[$_GET['start']];

        if($id == "")
            $id = $software[$_GET['download']];

        if(isset($id['download']['all'])){
            $source = $id['download']['all'];
        }else{
            $source = $id['download'][$osclient];
        }
        
        if ($os === "mac") {
            $destination = getenv("HOME"). "/Downloads/";
        }else if ($os === "windows") {
            $destination = getenv("USERPROFILE"). "\\Downloads\\";
        }else if ($os === "linux") {
            $destination = getenv("HOME"). "/Downloads/";
        }

        if(isset($id['download']['file'])){
            $filename = $id['download']['file'];
        }else{
            $filename = basename($source);
        }
        
        $destination = $destination . $filename;
    }

    if(isset($_GET['software'])){

        $array = array (
            'title' => "",
            'download' => "",
            'path' => "",
            'size' => 0,
            'version' => ""
        );
        
        $id = $software[$_GET['software']];

        $array['title'] = $id['title'];
        if(isset($id['download']['all'])){
            $array['download'] = $id['download']['all'];
        }else{
            $array['download'] = $id['download'][$os];
        }
        $array['path'] = $id['path'][$os];
        $array['size'] = $id['download']['size'];
        $array['version'] = $id['download']['version'];

        echo json_encode($array);
        
    }else if(isset($_GET['pause'])){

        echo $_GET['pause'];
        $_SESSION['pause'] = $_GET['pause'];

    }else if(isset($_GET['download'])){

        if($source != "") //Linux scripts without download
        {
            set_time_limit(10000);
            $_SESSION['pause'] = "";
            /*
            $source = file_get_contents($_GET["url"]);
            if (empty($source)) {
              die('No Content Received');
            }
            if (!is_dir($destination)){
               echo $error;
            }
            if (file_put_contents($destination . $filename , $source)) {
               echo ",100";
            }
            */
            
            ob_flush();
            flush();

            $curl = curl_init();
            
            curl_setopt($curl, CURLOPT_URL, $source);
            if (file_exists($destination)) {
                $from = filesize($destination);
                //curl_setopt($curl, CURLOPT_RANGE, $from . "-");
                curl_setopt($curl, CURLOPT_RESUME_FROM, $from);
                $handle = fopen($destination, 'a+');
            }else{
                $handle = fopen($destination, 'w+');
            }
            if (!$handle) {
                exit;
            }

            $callback = function($resource,$download_size, $downloaded, $upload_size, $uploaded)
            {
                if($download_size > 0)
                    echo "," .round($downloaded / $download_size  * 100);

                ob_flush();
                flush();

                while($_SESSION['pause'] == "pause")
                {
                    sleep(1);
                }
            };
            /*
            $abort = function()
            {
                echo "error";
            };
            */
            //curl_setopt($curl, CURLOPT_TIMEOUT, 300);
            curl_setopt($curl, CURLOPT_BINARYTRANSFER, true);
            curl_setopt($curl, CURLOPT_FILE, $handle); // Set the output file for the curl request
            curl_setopt($curl, CURLOPT_HEADER, false);
            //curl_setopt($curl, CURLOPT_WRITEHEADER, '/dev/null');
            curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true); // Follow http redirections
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false); // Verify SSL certificate of the remote server
            curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 30); // Wait 30s maximum while trying to connect to the remote server
            curl_setopt($curl, CURLOPT_MAXREDIRS, 4); // Following a maximum of 4 redirections
            curl_setopt($curl, CURLOPT_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTPS | CURLPROTO_FTP | CURLPROTO_FTPS); // Only allow http(s) and ftp(s) protocol for connection to the remote server
            curl_setopt($curl, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']); // Define the UserAgent to be used for requests to the remote server.
            curl_setopt($curl, CURLOPT_REFERER, dirname($source)); // Define the Referer to be used for requests to the remote server.
            curl_setopt($curl, CURLOPT_BUFFERSIZE, 1024);

            curl_setopt($curl, CURLOPT_NOPROGRESS, false);
            curl_setopt($curl, CURLOPT_PROGRESSFUNCTION, $callback);
            //curl_setopt($curl, CURLOPT_READFUNCTION, $abort); // check if user request abort


            //$data = curl_exec($curl);
            $error = curl_error($curl);
            curl_exec($curl);
            curl_close($curl);
            fclose($handle);

            ob_flush();
            flush();
            
            echo $error;
        }

    }else{
?>
<!DOCTYPE html>
<html>
    <head>
        <?php include "header.php" ?>
        <script>
            $(document).ready(function() {
                download(<?php echo "\"".$_GET['start']."\""; ?>);
            });
        </script>
    </head>
    <body>
        <div class="container">
            <?php include "menu.php" ?>
            <br/><br/>
            <div class="row">
                <div class="col">
                    <center>
                        <table class="table table-active bg-light table-bordered">
                            <tbody>
                                <tr>
                                    <td>
                                        <span>
                                        <?php echo $source; ?>
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div class="input-group w-100">
                                            <span class = "input-group-addon w-75">
                                                <div class="progress progress-striped active" style="margin-top:10px;">
                                                  <div class="progress-bar" style="width:0%" id="progressBar"></div>
                                                </div>
                                            </span>
                                            <span class = "input-group-addon w-25">
												<center>
													<button class="pause btn btn-primary" type="button">Pause</button>
												</center>
                                            </span>
                                        </div>
                                        <div id="output" style="display:none"></div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span><?php echo $destination; ?></span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </center>
                </div>
            </div>
        </div>
    </body>
</html>
<?php } ?>