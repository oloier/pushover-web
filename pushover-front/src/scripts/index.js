import "../styles/style.sass"

//
// form submit capture
//
const titleInput = document.querySelector(".title")
const messageInput = document.querySelector(".message")
const urlInput = document.querySelector(".url")
const attachmentInput = document.querySelector(".file")
const preview = document.querySelector(".preview")
const previewTitle = document.querySelector(".preview-title")
const previewMessage = document.querySelector(".preview-message")
const thumbnail = document.querySelector(".thumbnail")
const hostURL = "https://hostname-set.com/push/"

const pushPushover = (data) => {
	const opts = {
		method: "POST",
		headers: { "Content-Type": "application/json;charset=UTF-8" },
		body: JSON.stringify(data),
	}
	return fetch(hostURL, opts)
}

const saveAttachmentInput = () => {
	const formData = new FormData()
	formData.append(attachmentInput.name, attachmentInput.files[0].replace("C:\\fakepath\\", ""))
	const opts = {
		method: "POST",
		body: formData,
	}
	return fetch(`${hostURL}/upload`, opts)
}

const updatePreview = () => {

	preview.classList.remove("hidden")
	previewTitle.innerText = titleInput.value
	previewMessage.innerText = messageInput.value
	if (previewTitle.innerText === "" && previewMessage.innerText === "") {
		preview.classList.add("hidden")
	}
}

document.querySelector(".form").addEventListener("submit", async (e) => {
	e.preventDefault()
	const data = {
		title: titleInput.value,
		message: messageInput.value,
		url: urlInput.innerText,
		attachment: attachmentInput.value,
	}

	const upload = await saveAttachmentInput()
	if (upload.ok) {
		const push = await pushPushover(data)
		if (push.ok) {
			alert("success")
		}
		else {
			alert("failed")
		}
	}
})

//
// url listener messageInput field
// 
const findUrls = (text) => {
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

//
// grab URLs on updates to textarea
//
["keydown", "change"].forEach((eventName) => {
	titleInput.addEventListener(eventName, () => { 
		updatePreview()
	})

	messageInput.addEventListener(eventName, () => {
		updatePreview()
		// auto-resize textarea
		messageInput.style.height = `auto` // reset to recalc each call
		const offset = messageInput.offsetHeight - messageInput.clientHeight
		const height = messageInput.scrollHeight + offset
		messageInput.style.height = `${height}px`
		
		// update url overlay with discovered links
		const urls = findUrls(messageInput.value)
		if (typeof urls !== undefined && urls.length > 0) {
			urlInput.innerText = urls[0]
		}
		else {
			urlInput.innerText = ""
		}
	}, false)
})

//
// file upload preview
//

const simulateClick = function (elem) {
	const evt = new MouseEvent("click", {
		bubbles: true,
		cancelable: true,
		view: window,
	})
	!elem.dispatchEvent(evt)
}

attachmentInput.onchange = () => {
	if (attachmentInput.files.length > 0) {
		const fileSize = attachmentInput.files[0].size / 1024 / 1024
		console.log(`${fileSize.toFixed(2)} MB`)
		if (fileSize > 2.5) {
			alert("File cannot exceed 2.5MB")
		}
		else {
			const reader = new FileReader()
			reader.onload = (e) => {
				const img = document.createElement("img")
				img.src = e.target.result
				const thumb = thumbnail.getElementsByTagName("img")
				if (thumb.length > 0) {
					thumbnail.removeChild(thumb[0])
				}
				thumbnail.appendChild(img)
				document.querySelector(".upload").classList.add("hidden")
				document.querySelector("img").addEventListener("click", (e) => {
					simulateClick(attachmentInput)
				})
			}
			reader.readAsDataURL(attachmentInput.files[0])
		}
	}
}
