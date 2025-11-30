Write-Host "Generating CSV file with all name combinations..."
$nouns = Import-Csv -Path "nouns.csv" | ForEach-Object { $_.Word }
$adjectives = Import-Csv -Path "adjectives.csv" | ForEach-Object { $_.Word }

$combinations = foreach ($noun in $nouns) {
    foreach ($adj in $adjectives) {
        "$adj $noun"
    }
}

$combinations | ForEach-Object { [PSCustomObject]@{NameCombination=$_} } | Export-Csv -Path "name_combinations.csv" -NoTypeInformation

Write-Host "CSV file has been created with all name combinations."