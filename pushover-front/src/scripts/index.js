import "../styles/style.sass"

// ************************ form submit ******************* //
document.querySelector(".form").addEventListener("submit", async (e) => {
	e.preventDefault()
	const data = {
		title: document.querySelector(".title").value,
		message: document.querySelector(".message").value,
		url: document.querySelector(".url").innerText,
		attachment: document.querySelector(".file").value,
	}

	const upload = await saveAttachment()
	if (upload.ok) {
		const push = await pushIt(data)
		if (push.ok) {
			// alert
		}
	}
})

const saveAttachment = () => {
	const fileInput = document.querySelector(".file")
	const formData = new FormData()
	formData.append(fileInput.name, fileInput.files[0])
	console.log(fileInput.files[0])
	const opts = {
		method: "POST",
		body: formData,
	}
	return fetch("http://localhost:3000/upload", opts)
}

const pushIt = (data) => {
	const opts = {
		method: "POST",
		headers: { "Content-Type": "application/json;charset=UTF-8" },
		body: JSON.stringify(data),
	}
	return fetch("http://localhost:3000/", opts)
}
// function PushIt(data = {}) {
// 	const xhr = new XMLHttpRequest()
// 	xhr.addEventListener("load", (e) => console.log(e.responseText))
// 	xhr.open("POST", "http://localhost:3000/")
// 	xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
// 	xhr.send(JSON.stringify(data))
// }

// ************************ url listener ****************** //
const foundUrls = (text) => {
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
const message = document.querySelector(".message");
["keyup", "change"].forEach((eventName) => {
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

// file upload preview
const fileInput = document.querySelector(".file")
fileInput.onchange = () => {
	const reader = new FileReader()
	reader.onload = (e) => {
		const img = document.createElement("img")
		img.src = e.target.result
		const thumbnail = document.querySelector(".thumbnail")
		const thumb = thumbnail.getElementsByTagName("img")
		if (thumb.length > 0) {
			thumbnail.removeChild(thumb[0])
		}
		thumbnail.appendChild(img)
	}
	reader.readAsDataURL(fileInput.files[0])
}
