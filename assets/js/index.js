const cam = document.getElementById('cam');
var listaPresenca = [];
var alunos = [];

function fazGet(url) {
    let request = new XMLHttpRequest()
    request.open("GET", url, false)
    request.send()
    return request.responseText
}

function main() {
    let data = fazGet("https://localhost:7188/api/Cadastro/GetAllCadastro");
    alunos = JSON.parse(data);
    console.log(alunos);
}

main()

const startVideo = () => {
    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        if (Array.isArray(devices)) {
            devices.forEach(device => {
                if (device.kind === 'videoinput') {
                    // Usar câmera específica pelo 'label':
                    // console.log(device);

                    if (device.label.includes('REDRAGON')) {
                    // if (device.label.includes('')) {
                        navigator.getUserMedia(
                            { video: {
                                deviceId: device.deviceId
                            }},
                            stream => cam.srcObject = stream,
                            error => console.error(error)
                        )
                    }

                }
            })
        }
    })
}

const loadLabels = () => {
    const labels = [];
    console.log(alunos.length);
    for (let i = 0; i < alunos.length; i++) {
        labels[i] = alunos[i];
    }
    // const labels = ['Leonardo Aoki', 'Luan Natan', 'Luiz Ciantela']
    return Promise.all(labels.map(async label => {
        const descriptions = []
        for (let i = 1; i <= 3; i++) {
            const img = await faceapi.fetchImage(`/assets/lib/face-api/labels/${label.matricula}/${label.imgPath}_${i}.jpg`)
            const detections = await faceapi
                .detectSingleFace(img)  
                .withFaceLandmarks()
                .withFaceDescriptor()
            descriptions.push(detections.descriptor)
        }
        return new faceapi.LabeledFaceDescriptors(label.nome, descriptions)
    }))
}

Promise.all([
    // Redes neurais:
    faceapi.nets.tinyFaceDetector.loadFromUri('/assets/lib/face-api/models'), // Detectar rostos no vídeo
    faceapi.nets.faceLandmark68Net.loadFromUri('/assets/lib/face-api/models'), // Desenhar traços no rosto
    faceapi.nets.faceRecognitionNet.loadFromUri('/assets/lib/face-api/models'), // Reconhecimento facial
    faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/lib/face-api/models') // Desenhar ao redor do rosto
]).then(startVideo)

cam.addEventListener('play', async () => {
    const canvas = faceapi.createCanvasFromMedia(cam)
    const canvasSize = {
        width: cam.width,
        height: cam.height
    }
    const labels = await loadLabels()
    faceapi.matchDimensions(canvas, canvasSize)
    document.body.appendChild(canvas)
    setInterval(async () => {

        const detections = await faceapi
            .detectAllFaces(
                cam,
                new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, canvasSize)
        const faceMatcher = new faceapi.FaceMatcher(labels, 0.6)
        const results = resizedDetections.map(d => 
            faceMatcher.findBestMatch(d.descriptor)    
        )

        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

        faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        results.forEach((result, index) => {
            const box = resizedDetections[index].detection.box
            const { label, distance } = result
            new faceapi.draw.DrawTextField([
                `${label} (${parseInt(distance * 100, 10)})`
            ], box.bottomLeft).draw(canvas)

            const date = Date(Date.UTC(2020, 1, 20, 8, 0, 0))

            if (label != "unknown") {
                if (!listaPresenca.includes(label)) {
                    let linha = criaLinha(label, date);
                    tabela.appendChild(linha);
                }
            }

        })
        
    }, 100)
})

function criaLinha(label, date) {
    linha = document.createElement("tr");
    tdNome = document.createElement("td");
    tdDate = document.createElement("td");
    tdNome.innerHTML = label
    tdDate.innerHTML = date

    linha.appendChild(tdNome);
    linha.appendChild(tdDate);

    let i = listaPresenca.length
    listaPresenca[i] = label

    return linha;
}