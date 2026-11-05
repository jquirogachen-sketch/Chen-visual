<?php
declare(strict_types=1);
// PHP 8+. Configure CONTACT_FROM_EMAIL with an address authorized by your host.
// CONTACT_TO_EMAIL is optional; it defaults to the published studio address.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function reply(int $code, array $body): never {
    http_response_code($code);
    echo json_encode($body);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, ['ok'=>false, 'error'=>'POST required.']);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 17 * 1024 * 1024) reply(413, ['ok'=>false, 'error'=>'Please keep attachments under 15 MB.']);
function field(string $key, int $limit): string {
    if (isset($_POST[$key]) && !is_string($_POST[$key])) reply(400, ['ok'=>false, 'error'=>'Invalid input.']);
    $value = trim($_POST[$key] ?? '');
    if (strlen($value) > $limit) reply(400, ['ok'=>false, 'error'=>'A field is too long.']);
    return $value;
}
if (field('website', 500) !== '') reply(200, ['ok'=>true]);
$name = field('name', 480);
$email = field('email', 254);
$studio = field('studio', 640);
$type = field('type', 80);
$images = field('images', 20);
$message = field('message', 20000);
$references = field('references', 2000);
if (!$name || !$message || !filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $email)
    || !in_array($type, ['Residential','Commercial','Real estate','Other'], true)
    || !in_array($images, ['1','3','5+','Unsure'], true)
    || ($references !== '' && (!filter_var($references, FILTER_VALIDATE_URL) || !preg_match('~^https?://~i', $references)))) {
    reply(400, ['ok'=>false, 'error'=>'Please check all required fields and use an http or https reference link.']);
}
$from = getenv('CONTACT_FROM_EMAIL') ?: '';
$to = getenv('CONTACT_TO_EMAIL') ?: 'jquirogachen@gmail.com';
if (!filter_var($from, FILTER_VALIDATE_EMAIL) || !filter_var($to, FILTER_VALIDATE_EMAIL)
    || preg_match('/[\r\n]/', $from.$to) || !function_exists('mail')) {
    reply(503, ['ok'=>false, 'error'=>'The contact service is not configured yet. Please email jquirogachen@gmail.com directly.']);
}
// Use a private system temp file and a lock to serialize submissions per IP.
$ratePath = sys_get_temp_dir().'/chen-quote-'.hash('sha256', __DIR__.($_SERVER['REMOTE_ADDR'] ?? '')).'.rate';
$lock = @fopen($ratePath, 'c+');
if (!$lock || !flock($lock, LOCK_EX)) reply(503, ['ok'=>false, 'error'=>'Please try again later or contact us by email.']);
$last = (int)stream_get_contents($lock);
if ($last && time() - $last < 60) reply(429, ['ok'=>false, 'error'=>'Please wait a minute before sending another inquiry.']);
$attachments = [];
$files = $_FILES['files'] ?? null;
if ($files) {
    if (!is_array($files['name'] ?? null) || count($files['name']) > 5) reply(400, ['ok'=>false, 'error'=>'Choose up to 5 files.']);
    $total = 0;
    $mime = new finfo(FILEINFO_MIME_TYPE);
    $allowed = ['jpg'=>['image/jpeg'], 'jpeg'=>['image/jpeg'], 'png'=>['image/png'], 'webp'=>['image/webp'], 'pdf'=>['application/pdf'], 'zip'=>['application/zip','application/x-zip-compressed','application/octet-stream']];
    foreach ($files['name'] as $i => $filename) {
        $error = $files['error'][$i] ?? UPLOAD_ERR_NO_FILE;
        if ($error === UPLOAD_ERR_NO_FILE) continue;
        $temp = $files['tmp_name'][$i] ?? '';
        if ($error !== UPLOAD_ERR_OK || !is_uploaded_file($temp)) reply(400, ['ok'=>false, 'error'=>'An attachment could not be uploaded. Please use a references link instead.']);
        $total += filesize($temp);
        if ($total > 15 * 1024 * 1024) reply(413, ['ok'=>false, 'error'=>'Attachments must total 15 MB or less.']);
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $contentType = $mime->file($temp);
        if (!isset($allowed[$extension]) || !in_array($contentType, $allowed[$extension], true)) reply(400, ['ok'=>false, 'error'=>'Please use valid JPG, PNG, WebP, PDF or ZIP files.']);
        $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($filename));
        $attachments[] = ['name'=>substr($safeName, 0, 180), 'type'=>$contentType, 'data'=>file_get_contents($temp)];
    }
}
$boundary = 'chen_'.bin2hex(random_bytes(20));
$text = "New project inquiry\n\nName: $name\nStudio: $studio\nEmail: $email\nProject type: $type\nImages: $images\nReferences: $references\n\n$message\n";
$body = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n".chunk_split(base64_encode($text));
foreach ($attachments as $attachment) {
    $body .= "--$boundary\r\nContent-Type: {$attachment['type']}\r\nContent-Disposition: attachment; filename=\"{$attachment['name']}\"\r\nContent-Transfer-Encoding: base64\r\n\r\n".chunk_split(base64_encode($attachment['data']));
}
$body .= "--$boundary--\r\n";
$headers = ['From: Chen Visualization <'.$from.'>', 'Reply-To: '.$email, 'MIME-Version: 1.0', 'Content-Type: multipart/mixed; boundary="'.$boundary.'"'];
// Reserve the cooldown even when the mail service fails, to limit repeated attempts.
ftruncate($lock, 0);
rewind($lock);
fwrite($lock, (string)time());
fflush($lock);
$sent = @mail($to, 'Chen Visualization - Project inquiry', $body, implode("\r\n", $headers));
flock($lock, LOCK_UN);
fclose($lock);
if (!$sent) reply(503, ['ok'=>false, 'error'=>'Unable to send right now. Please email jquirogachen@gmail.com directly.']);
reply(200, ['ok'=>true]);
