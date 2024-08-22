<!DOCTYPE html>
<html>
<body>
<font face="courier">
<?php

######################## VARIABLES #############################################

$WFLS_FILE_STORE='E:\RAW_ARCHIVE';

################################################################################

$url = 'http://'.$_SERVER['HTTP_HOST'].$_SERVER['PHP_SELF'];

$url_explode=explode("/",$url);

$zipfile=$url_explode[4];

$filedir=$url_explode[5];

$filename=$url_explode[6];

$zipfile_explode=explode("_",$zipfile);

$filedate=$zipfile_explode[1];

$full_archive_file_path="$WFLS_FILE_STORE/$filedate/$zipfile";

$full_compressed_file_path="$WFLS_FILE_STORE/tmp/$filedate/$filedir/$filename";

echo "<b>hello $filename: </b> <br/><br/>";

$result = file_get_contents
   ("zip://$full_archive_file_path#$filedir/$filename");
echo $result;

?>
</font>
</body>
</html>

