document.addEventListener('DOMContentLoaded', function() {
    console.log("Script carregado!");

    const sidebarMenu = document.getElementById('sidebar-menu');
    const addVeiculoFormContainer = document.getElementById('add-veiculo-form-container');
    const welcomeMessage = document.getElementById('welcome-message');
    
    if (sidebarMenu) {
        const addItemLink = sidebarMenu.querySelector('li.sidebar-action a');
        if (addItemLink) {
            addItemLink.addEventListener('click', function(event) {
                event.preventDefault(); // Impede o link de navegar
                if (addVeiculoFormContainer) {
                    welcomeMessage.style.display = 'none';//Esconde boas vindas
                    addVeiculoFormContainer.style.display = 'block'; // Mostra o formulário
                }
            });
        }
    }
});