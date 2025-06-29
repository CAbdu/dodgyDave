// Test script pour vérifier l'endpoint d'analyse
async function testAnalyzeEndpoint() {
    try {
        console.log('Envoi de la requête...');
        const response = await fetch('https://polygon-api-worker.abduchaib.workers.dev/api/v1/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "user",
                        content: "Hello, can you respond to this test message?"
                    }
                ]
            })
        });

        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        
        const data = await response.json();
        console.log('Response complète:', JSON.stringify(data, null, 2));
        
        if (response.ok) {
            console.log('✅ Endpoint fonctionne correctement!');
        } else {
            console.log('❌ Erreur détectée:');
            console.log('  - Message:', data.error);
            console.log('  - Détails:', data.details);
        }
    } catch (error) {
        console.error('❌ Erreur de connexion:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

testAnalyzeEndpoint(); 