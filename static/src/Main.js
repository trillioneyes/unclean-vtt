document.querySelectorAll('.prototype')
    .forEach((element) => {
        element.addEventListener('dragstart', pickup);
    });

for (const dropzone of
     document.querySelectorAll('#tabletop, .drawer')) {
  dropzone.addEventListener('dragenter', onDragEnter);
  dropzone.addEventListener('dragover', onDragEnter);
  dropzone.addEventListener('drop', onDrop, {capture: true});
}

loadTokens();

let syncInterval = setInterval(syncDirtyTokens, 1);

openWebSocket((body) => {
  body.updates.forEach(tokenFromProperties);
  body.deletes.forEach((id) => {
    const element = document.getElementById(id);
    element.parentElement.removeChild(element);
  });
});
