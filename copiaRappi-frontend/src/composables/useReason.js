

export function TransformReasons(reasonsArray, error) {
    try {
            let reasons = [];
            const enumerableReasons = {
                'ORDER': 'Problemas con mi pedido',
                'PAYMENT': 'Problemas con el pago',
                'OTHER': 'Otros problemas',
                'ACCOUNT': 'Problemas con mi cuenta',
            };
            reasons = reasonsArray.map(reason => enumerableReasons[reason] || reason);
            return reasons;
        }
        catch (err) {
            console.error('Error al transformar las razones de soporte:', err);
            return error.value = 'No se pudieron cargar las razones de soporte';
        }
}