export default defineEventHandler(async event => {
	const { files, url } = await readBody(event)

	for (const file of files) {
	  await storeFileLocally(
		// the file object
		file, // you can add a name for the file or length of Unique ID that will be automatically generated!
		file.name.match(/.*(?=\.)/g)[0], // the folder the file will be stored in
		url
	  )
  
	  // {OR}

	  // Parses a data URL and returns an object with the binary data and the file extension.
	  const { binaryString, ext } = parseDataUrl(file.content)
	}
  
	return "success!"
  })