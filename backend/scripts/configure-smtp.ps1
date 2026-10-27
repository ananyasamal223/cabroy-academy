$ErrorActionPreference = 'Stop'
$taskBackendDir = Split-Path -Parent $PSScriptRoot
$taskEnvPath = Join-Path $taskBackendDir '.env'
Write-Host 'Configure the email service for signup and password-reset codes.'
$taskHost = 'smtp.gmail.com'
$taskPort = '465'
if ($taskPort -notin @('465','587')) { throw 'Use port 465 or 587.' }
$taskUsername = (Read-Host 'Sending Gmail address').Trim()
$taskFrom = $taskUsername
$taskSecret = Read-Host 'SMTP password / provider app password (hidden)' -AsSecureString
$taskSecretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskSecret)
try {
    $taskPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskSecretPointer).Replace(' ', '')
    $taskValues = @{ SMTP_HOST=$taskHost; SMTP_PORT=$taskPort; SMTP_USER=$taskUsername; SMTP_PASS=$taskPassword; SMTP_FROM=$taskFrom }
    $taskEnvText = if (Test-Path -LiteralPath $taskEnvPath) { [IO.File]::ReadAllText($taskEnvPath) } else { '' }
    foreach ($taskKey in $taskValues.Keys) {
        $taskValue = $taskValues[$taskKey]
        if ([string]::IsNullOrWhiteSpace($taskValue) -or $taskValue.Contains("'" ) -or $taskValue.Contains([char]10) -or $taskValue.Contains([char]13)) { throw 'Values must be nonempty and must not contain quotes or line breaks; configure .env manually for special credentials.' }
        $taskLine = $taskKey + "='" + $taskValue + "'"
        $taskPattern = '(?m)^\s*' + [regex]::Escape($taskKey) + '\s*=.*$'
        if ([regex]::IsMatch($taskEnvText,$taskPattern)) {
            $taskEnvText = [regex]::Replace($taskEnvText,$taskPattern,[System.Text.RegularExpressions.MatchEvaluator]{ param($taskMatch) $taskLine })
        } else { $taskEnvText += [Environment]::NewLine + $taskLine }
    }
    [IO.File]::WriteAllText($taskEnvPath,$taskEnvText,[Text.UTF8Encoding]::new($false))
    Write-Host 'SMTP settings saved locally. Restart the backend, then run npm run smtp:verify from the backend folder.'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskSecretPointer)
    $taskPassword = $null
}
