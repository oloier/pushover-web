import "../styles/style.sass"
import "bootstrap"

// ************************ form submit ******************* //


document.querySelector(".form").addEventListener("submit", (e) => {
	e.preventDefault()
	// alert("hi")
	// sendPush()
	const data = {
		title: document.querySelector(".title").value,
		message: document.querySelector(".message").value,
		url: document.querySelector(".url").innerText,
		file: document.querySelector(".file").value,
	}
	PushIt(data)
})

function PushIt(data = {}) {
	const XHR = new XMLHttpRequest()
	XHR.addEventListener("load", (e) => console.log(e.responseText))
	XHR.open("POST", "http://localhost:3000/")
	XHR.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
	XHR.send(JSON.stringify(data))
}

// ************************ url listener ****************** //
function foundUrls(text) {
	const urlRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gim

	const urls = text.match(urlRegex) || []
	if (urls.length > 0) {
		// prepend missing protocol
		urls.forEach((el, index, array) => {
			if (!el.match(/^[a-zA-Z]+:\/\//)) {
				array[index] = `https://${el}`
			}
		})
	}
	return urls || null
}

// grab URLs on updates to textarea
const message = document.querySelector(".message")
;["keyup", "change"].forEach((eventName) => {
	message.addEventListener(eventName, () => {
		const urlField = document.querySelector(".url")
		const urls = foundUrls(message.value)
		if (typeof urls !== undefined && urls.length > 0) {
			urlField.innerText = urls[0]
		}
		else {
			urlField.innerText = ""
		}
	}, false)
})

// ************************ drag and drop ***************** //
const html = document.querySelector("html")
const highlight = () => html.classList.add("highlight")
const unhighlight = () => html.classList.remove("highlight")

function preventDefaults(e) {
	e.preventDefault()
	e.stopPropagation()
}
// prevent default drag behaviors
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
	html.addEventListener(eventName, preventDefaults, false)   
	document.body.addEventListener(eventName, preventDefaults, false)
});

// highlight drop area when item is dragged over it
["dragenter", "dragover"].forEach((eventName) => {
	html.addEventListener(eventName, highlight, false)
});

[/* "dragleave",  */"drop"].forEach((eventName) => {
	html.addEventListener(eventName, unhighlight, false)
})

// handle dropped files
document.querySelector(".drop-area").addEventListener("drop", handleDrop, false)


function handleDrop(e) {
	const dt = e.dataTransfer
	const file = dt.files
	unhighlight()
	previewFile(file)
}

function previewFile(file) {
	const reader = new FileReader()
	const fileInput = document.querySelector(".file")
	file = file["0"]
	console.log(file)
	fileInput.value = file
	reader.readAsDataURL(file)
	reader.onloadend = function() {
		const img = document.createElement("img")
		img.src = reader.result
		const thumbnail = document.querySelector(".thumbnail")
		const thumbs = thumbnail.getElementsByTagName("img")
		if (thumbs.length > 0) {
			thumbnail.removeChild(thumbs[0])
		}
		thumbnail.appendChild(img)
	}
}
