<?php
declare(strict_types=1);

function hashcodRegistrationContract(): array
{
    return [
        'version' => '2026.09.18-1',
        'effective_date' => '18 de septiembre de 2026',
        'title' => 'Documento de Aceptación Contractual, Privacidad y Evidencia de Registro',
        'subtitle' => 'Hashcod Codespace® · DIKTATCART',
        'sections' => [
            [
                'title' => '1. Partes, objeto y alcance',
                'paragraphs' => [
                    'Este documento regula el registro voluntario de una plataforma en Hashcod Codespace y la relación derivada de ese registro entre la persona que completa el formulario, en lo adelante “el Usuario”, y Hashcod Codespace / DIKTATCART, en lo adelante “Hashcod”.',
                    'El objeto del registro es identificar la plataforma presentada por el Usuario, recibir la información y los archivos que éste decida suministrar para su evaluación, gestión, documentación o prestación de servicios, y conservar evidencia verificable de la aceptación de estas condiciones.'
                ],
            ],
            [
                'title' => '2. Capacidad y declaración de mayoría de edad',
                'paragraphs' => [
                    'El Usuario declara que tiene dieciocho (18) años o más y que cuenta con capacidad para aceptar este documento en nombre propio o, cuando corresponda, con autorización suficiente para actuar por la entidad o proyecto que representa.',
                    'Si una persona no cumple con la edad mínima exigida por el formulario, no debe completar ni enviar el registro.'
                ],
            ],
            [
                'title' => '3. Compromiso de suplir lo necesario',
                'paragraphs' => [
                    'El Usuario se compromete a suplir de manera oportuna toda información, explicación, archivo, autorización, permiso, acceso, evidencia o recurso que resulte razonablemente necesario para tramitar el registro, verificar la plataforma o ejecutar el servicio solicitado.',
                    'Esta obligación se limita a información y recursos lícitos, relacionados con el propósito del registro y que el Usuario tenga derecho a suministrar. Hashcod no exige la entrega de contraseñas personales, secretos ajenos, material obtenido ilícitamente ni información que el Usuario no esté autorizado a compartir.',
                    'La falta de información esencial puede impedir, suspender o retrasar el registro o el servicio hasta que los elementos necesarios sean aportados.'
                ],
            ],
            [
                'title' => '4. Veracidad, titularidad y responsabilidad sobre lo aportado',
                'paragraphs' => [
                    'El Usuario declara que los datos suministrados son verdaderos, actuales y suficientes para identificar el registro, y se obliga a corregir cualquier dato relevante que posteriormente resulte inexacto.',
                    'Respecto del código, documentación o archivos cargados, el Usuario declara que es titular de ellos o que posee autorización suficiente para entregarlos a Hashcod para los fines del registro y del servicio solicitado.',
                    'El Usuario conserva sus derechos sobre sus contenidos salvo que exista otro acuerdo escrito que disponga expresamente una licencia o cesión distinta.'
                ],
            ],
            [
                'title' => '5. Datos personales y finalidad del tratamiento',
                'paragraphs' => [
                    'Para gestionar el registro, Hashcod solicita nombre con apellidos, edad, cédula, nombre de la plataforma, correo electrónico y número de teléfono, además de la explicación o archivo asociado a la plataforma.',
                    'Los datos se utilizan para identificar el registro, comunicarse con el Usuario, verificar la solicitud, administrar la plataforma registrada, mantener evidencia de la aceptación contractual y atender incidencias, reclamaciones o requerimientos legales relacionados con el registro.',
                    'El tratamiento de datos personales se realizará conforme al marco aplicable de la República Dominicana, incluida la Ley núm. 172-13 sobre protección integral de datos personales. El Usuario podrá solicitar acceso, rectificación, actualización o las demás actuaciones que procedan conforme a la normativa aplicable y a los canales administrativos publicados por Hashcod.'
                ],
            ],
            [
                'title' => '6. Protección y almacenamiento',
                'paragraphs' => [
                    'Los campos personales sensibles del registro que la plataforma identifica como protegidos —nombre, cédula, correo electrónico y teléfono— se almacenan cifrados por el backend de Hashcod. Los archivos de código o explicación se almacenan en el almacenamiento privado configurado para la plataforma y se asocian al registro mediante metadatos e identificadores técnicos.',
                    'Hashcod aplicará medidas razonables de seguridad y control de acceso. Ningún sistema informático puede garantizar riesgo cero, por lo que las medidas de seguridad se revisan y actualizan de acuerdo con la operación de la plataforma.'
                ],
            ],
            [
                'title' => '7. Evidencias del registro conservadas por la plataforma',
                'paragraphs' => [
                    'Para acreditar el contenido y la trazabilidad del registro, Hashcod conserva o puede conservar, según el estado de la implementación, las siguientes evidencias asociadas al registro:'
                ],
                'bullets' => [
                    'Identificador único del registro.',
                    'Fecha y hora de creación y de aceptación contractual.',
                    'Versión de este documento y huella SHA-256 de su texto canónico.',
                    'Método de aceptación utilizado: checkbox de aceptación más envío del formulario.',
                    'Nombre con apellidos, cédula, correo y teléfono almacenados en forma protegida por el backend.',
                    'Edad declarada y nombre de la plataforma.',
                    'Nombre del archivo aportado, tipo MIME, tamaño y ruta privada de almacenamiento.',
                    'Huella SHA-256 del archivo de código o explicación aportado.',
                    'Huella SHA-256 de la evidencia contractual generada para ese registro.'
                ],
            ],
            [
                'title' => '8. Aceptación contractual electrónica',
                'paragraphs' => [
                    'Al marcar voluntariamente el checkbox de aceptación y posteriormente enviar el formulario, el Usuario manifiesta electrónicamente que ha tenido acceso a este documento, que declara haberlo leído y que acepta quedar vinculado por sus condiciones en lo que resulte legalmente aplicable.',
                    'La plataforma registra esa manifestación de voluntad junto con la versión y la huella SHA-256 del documento aceptado. Esta aceptación electrónica se utiliza como evidencia del consentimiento contractual y del contenido aceptado.',
                    'Esta aceptación por checkbox no se presenta como una “firma digital certificada” con equivalencia automática a una firma manuscrita en los términos técnicos del artículo 31 de la Ley núm. 126-02, salvo que se utilice adicionalmente un mecanismo de firma digital que reúna los atributos exigidos por esa ley.'
                ],
            ],
            [
                'title' => '9. Documentos y mensajes electrónicos',
                'paragraphs' => [
                    'Las partes reconocen que la oferta, aceptación, comunicaciones y evidencias relacionadas con este registro pueden producirse y conservarse en formato digital. La versión, fecha y huella criptográfica del documento permiten comprobar si el texto presentado posteriormente coincide con el texto aceptado.',
                    'Hashcod podrá conservar registros digitales relacionados con la aceptación en la medida necesaria para documentar la transacción, resolver controversias, mantener la integridad del registro y cumplir obligaciones legales.'
                ],
            ],
            [
                'title' => '10. Uso lícito y prohibiciones',
                'paragraphs' => [
                    'El Usuario se obliga a utilizar Hashcod de conformidad con las leyes de la República Dominicana, el orden público, los derechos de terceros y las condiciones particulares de los servicios que solicite.',
                    'No podrá utilizar el registro para atribuirse obras ajenas, suministrar material ilícito, vulnerar derechos de propiedad intelectual, introducir código malicioso o inducir a Hashcod a realizar actividades contrarias a la ley.'
                ],
            ],
            [
                'title' => '11. Propiedad intelectual y código generado por IA',
                'paragraphs' => [
                    'Cuando el Usuario suministre código o explicaciones generadas total o parcialmente mediante inteligencia artificial, será responsable de revisar su procedencia, licencias, dependencias, permisos de uso y posibles derechos de terceros antes de presentarlos como propios o autorizados.',
                    'El registro en Hashcod no constituye por sí solo una declaración estatal de autoría, patente, derecho de autor o titularidad exclusiva. Las evidencias técnicas sirven para documentar la información recibida y su integridad dentro del sistema.'
                ],
            ],
            [
                'title' => '12. Derechos del consumidor y normas imperativas',
                'paragraphs' => [
                    'Nada en este documento pretende eliminar derechos que la legislación dominicana reconozca de manera imperativa a consumidores o usuarios. Cuando la relación sea de consumo, resultarán aplicables las disposiciones obligatorias de la Ley núm. 358-05 y sus normas complementarias.',
                    'Si este documento llegara a utilizarse como contrato de adhesión frente a consumidores finales, Hashcod deberá observar los requisitos regulatorios que resulten aplicables a ese tipo de contrato.'
                ],
            ],
            [
                'title' => '13. Modificaciones y nuevas versiones',
                'paragraphs' => [
                    'Cada versión de este documento posee un número de versión y una huella SHA-256 propia. Una modificación material destinada a obligar nuevamente al Usuario deberá presentarse de forma identificable para una nueva aceptación cuando corresponda.',
                    'La evidencia de un registro anterior conservará la versión y huella del texto aceptado en ese momento, aunque posteriormente exista una versión más reciente.'
                ],
            ],
            [
                'title' => '14. Legislación aplicable y jurisdicción',
                'paragraphs' => [
                    'Este documento se interpreta conforme a las leyes de la República Dominicana, en particular las normas aplicables a contratación electrónica, documentos y mensajes de datos, protección de datos personales y, cuando proceda, protección de consumidores y usuarios.',
                    'Las controversias se someterán a los mecanismos y autoridades competentes de la República Dominicana, sin perjuicio de cualquier derecho o jurisdicción imperativa que resulte aplicable.'
                ],
            ],
            [
                'title' => '15. Integridad del documento',
                'paragraphs' => [
                    'Si una disposición resultare inválida o inaplicable, las demás conservarán su vigencia en la medida permitida por la ley. La interpretación del documento deberá procurar mantener su finalidad lícita sin ampliar obligaciones más allá de lo expresamente aceptado.'
                ],
            ],
        ],
        'legal_references' => [
            'Ley núm. 126-02 sobre Comercio Electrónico, Documentos y Firmas Digitales, especialmente sus disposiciones sobre formación y validez de contratos, manifestaciones de voluntad, conservación documental y firma digital.',
            'Ley núm. 172-13 sobre Protección Integral de los Datos Personales.',
            'Ley núm. 358-05 General de Protección de los Derechos del Consumidor o Usuario, cuando la relación califique como relación de consumo.'
        ],
    ];
}

function hashcodRegistrationContractCanonicalText(): string
{
    $contract = hashcodRegistrationContract();
    $parts = [
        $contract['title'],
        $contract['subtitle'],
        'Versión: ' . $contract['version'],
        'Vigente desde: ' . $contract['effective_date'],
    ];

    foreach ($contract['sections'] as $section) {
        $parts[] = (string)$section['title'];
        foreach (($section['paragraphs'] ?? []) as $paragraph) {
            $parts[] = trim((string)$paragraph);
        }
        foreach (($section['bullets'] ?? []) as $bullet) {
            $parts[] = '- ' . trim((string)$bullet);
        }
    }

    $parts[] = 'Referencias legales';
    foreach ($contract['legal_references'] as $reference) {
        $parts[] = '- ' . trim((string)$reference);
    }

    return implode("\n\n", $parts);
}

function hashcodRegistrationContractSha256(): string
{
    return hash('sha256', hashcodRegistrationContractCanonicalText());
}
