param(
    [string]$ResourceGroup = "rg-mathquest",
    [string]$Server = "mathquest-sql",
    [string]$RuleName = "DevMachine"
)

$ip = (Invoke-RestMethod https://api.ipify.org).Trim()
Write-Host "Current public IP: $ip"

$existing = az sql server firewall-rule show --resource-group $ResourceGroup --server $Server --name $RuleName 2>$null | ConvertFrom-Json

if ($existing -and $existing.startIpAddress -eq $ip) {
    Write-Host "Rule '$RuleName' already allows $ip. Nothing to do."
    exit 0
}

$verb = if ($existing) { "update" } else { "create" }
az sql server firewall-rule $verb --resource-group $ResourceGroup --server $Server --name $RuleName --start-ip-address $ip --end-ip-address $ip
Write-Host "Rule '$RuleName' now allows $ip. It can take a minute to apply."
