const cam = document.getElementById('cam')
var listaPresenca = []

const startVideo = () => {
    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        if (Array.isArray(devices)) {
            devices.forEach(device => {
                if (device.kind === 'videoinput') {
                    // Usar câmera específica pelo 'label':
                    // console.log(device);

                    // if (device.label.includes('REDRAGON')) {
                    if (device.label.includes('')) {
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
    const labels = ['Leonardo Aoki', 'Luan Natan', 'Luiz Ciantela']
    return Promise.all(labels.map(async label => {
        const descriptions = []
        for (let i = 1; i <= 3; i++) {
            const img = await faceapi.fetchImage(`/assets/lib/face-api/labels/${label}/${i}.jpg`)
            const detections = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor()
            descriptions.push(detections.descriptor)
        }
        return new faceapi.LabeledFaceDescriptors(label, descriptions)
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

    console.log(listaPresenca);
    return linha;
}

// ----------------------------------

function getAllImagens(url) {
    let request = new XMLHttpRequest()
    request.open("GET", url, false)
    request.send()
    return request.responseText
}

function main() {
    let data = getAllImagens("https://localhost:7188/api/Imagens/GetAllImagens");
    let allUsuarios = JSON.parse(data);
    allUsuarios.forEach(element => {
        console.log(allUsuarios);
    });
}

main()






// function getBase64Img() {
//     return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQBAMAAAB8P++eAAAAMFBMVEX////7+/vr6+vNzc2qqqplywBWrQD/Y5T/JTf+AADmAABeeEQvNydqAAAGBAMAAAGoF14oAAAEBUlEQVR42u2WTUwUVxzA/2925LIojsyqCLtMqSQeFJeFROPHstjdNkZdkaiX9mRTovYgSYNFE43Rg5IeNG5SqyaVcGzXkvTm7hZWq9bKriAYYzSLBI3WAplp0jY2kV3fzPuYGcBxD/bmO0zevPeb//f7v0FQ5EDvwf8LFG89ixYDol9Wo+smKal2sHF6kM6q7qbE5tY03d7SHR6ygiuvwY1txkzIlPaD3NQ4Zryk/PCP1wKibBlI97dq+idXUxqgcEkVnruS/smRpuWaCbrHU5pc/wyTQsata0U77wVBTlRP9UNkT9oE61K9AHL9VERbeTVurMjNm54mqrFw8CwKmWBfpf6V2Dx/TdxN3YjMf2JwIEZ8JnjnEbEjvLAQZ1EKlxkciJ9UcdD1Z5ztDmgsgPIrMkWtMgfd41xOYXZOIjUcLB3tdchypHWIgb5k2gH0nE0zMHjRCRTLWxgY/VQrDuybcAQ/DDEwmwEn8COlSDBcTUE0GXcEjRzqoDDhDH7sfccg2szAt9hogjBFQFRmDyd9N1VTEFegXXKEVKQFJHEUd0DSKhLthIm0HSQpnNdCNizgq147GP0m7QTygNMye6NqM9ekwlG4kLI5I4cMZ+bVhMA8MwX1rw9oIjakAYX6jXlBRRJ4BF6PwmRSfQyLFhJwWy/IG8khKuirljODG0DfGAd3qCBNEol5vCqFAxqYLeUyB0H2A2Q0DspRD3BQfJEc5KBl6KprG6pNEPqqfkKzOQBsha2bQeVw6g3nSySaGYgb99ylhsLDLVYQ3E+oozOGHKzVbCBs+HkuUm6ivd4E0ZYeNTPTTrn51+0wA9TJgpZVLeaV1y+4yS8c64W0/AcFTBCHK/fFEMwFAmo4KRldE0ZxsF8cGbTuzYqHtOz8t6e8TMk5CcjNSC+kdcfgPyag9AoDhUQARmvAcIiAW3v0JzWJg64BJXdBQ21+/b4zwMqRW5dA2h3I7+onYJd+Y4i3FbyMxz4hxE7hS2MBdSq6Fgq6Bny/dxv6Sk76COj6Yz91ZG8dToQ7oYNCqu4QjX9FK5UoPt/PXO701mruhwcxGP2ecahzzxBtUtlzLHclsXtBA6wc+a2brlUc8TCvg5cPM7LiaOPT8Y4ub3bpAbqy+MQ18xRmvIe5nr83YXDt8Nca0/GveWniSHByybEVwx1dD1ccYB/6yF8DTaGcYLFA391o6DjjohaWfKXQ/xCWazmhPDhNbYf2WH4fse9zhRUkLwrXlUD+9iVD5HR77KWheclxkqsZ1bM+pqcWZ2xVe0zXjPb6pyO8IK1l5trcA7mLKuo48+VpQG0BuPmZeTbs9Vi+9oQyqv6Ieyou4FybU+HqRS4o+TH1VG7MvgFFjvfguwFfA4FobmCxcnTPAAAAAElFTkSuQmCC";
// }
// var base64img = getBase64Img();
// function Base64ToImage(base64img, callback) {
//     var img = new Image();
//     img.onload = function() {
//         callback(img);
//     };
//     img.src = base64img;
// }
// Base64ToImage(base64img, function(img) {
//     document.getElementById('main').appendChild(img);
//     var log = "w=" + img.width + " h=" + img.height;
//     document.getElementById('log').value = log;
// });












// function getAllImagens() {
//     let request = new XMLHttpRequest()
//     request.open("GET", url, false)
//     request.send()
//     return request.responseText
// }

// function main() {
//     let data = getAllImagens("https://localhost:7188/api/Imagens/GetAllImagens");
//     let allImagens = JSON.parse(data);
//     console.log(allImagens);
// }

// var base64img = getAllImagens();

// function Base64ToImage(base64img, callback) {
//     var img = new Image();
//     img.onload = function() {
//         callback(img);
//     };
//     img.src = base64img;
// }

// Base64ToImage(base64img, function(img) {
//     document.getElementById('main').appendChild(img);
//     var log = "w=" + img.width + " h=" + img.height;
//     document.getElementById('log').value = log;
// });

// main()