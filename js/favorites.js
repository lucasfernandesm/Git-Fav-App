

import { GithubUsers } from "./githubUsers.js"

export class Favorites {
    constructor(root) {
        this.root = document.querySelector(root)
        this.tbody = this.root.querySelector('table tbody')

        this.load()
    } 
    
    noFav() {
        const noFav = this.root.querySelector('.noFavorites')

        if(this.entries.length !== 0) {
            noFav.classList.add('hide')
        }
        else {
            noFav.classList.remove('hide')
        }
    }

    load() {
        this.entries = JSON.parse(localStorage.getItem('@github-favorites:')) || []
    }

    save() {
        localStorage.setItem('@github-favorites:', JSON.stringify(this.entries))
    }

    delete (user) {
        const fielteredEntries = this.entries.filter(entry => entry.login !== user.login)
        this.entries = fielteredEntries

        this.update()
        this.save()
    }

    async add(username) {
        try {
            const userExist = this.entries.find(entry => entry.login === username)

            if(username.length == 0) {
                throw new Error('Você não digitou o nome de nenhum perfil!')
            }

            if(userExist) {
                throw new Error('Perfil já consta na lista!')
            }

            const user = await GithubUsers.search(username)
            if(user.login === undefined){
                throw new Error('Não encontramos esse perfil!')
            }
            
            this.entries = [user, ...this.entries]
            this.update()
            this.save()
        } catch(error) {
            alert(error.message)
        }
    }
}

export class FavoriteViews extends Favorites {
    constructor(root) {
        super(root)  
        this.update()  
        this.onAdd()    
    }  

    onAdd() {
        const addButton = this.root.querySelector('.search button')
        const input = this.root.querySelector('.search input')
        const suggestionsBox = this.root.querySelector('.suggestions');

        const handleAdd = () => {
            let { value } = input

            const githubUrlPattern = /https?:\/\/(www\.)?github\.com\/([a-zA-Z0-9-]+)(\/.*)?/;
            const match = value.match(githubUrlPattern);

            if (match) {
                value = match[2];
            }
            
            this.add(value)
            input.value = ""
        }

        addButton.onclick = handleAdd

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleAdd()
            }
        })

        input.addEventListener('input', async () => {
            const query = input.value;
    
            if (query.length > 3) {
                const suggestions = await GithubUsers.searchSuggestions(query);
                this.showSuggestions(suggestions, input, suggestionsBox);
            } else {
                suggestionsBox.innerHTML = '';
            }
        });
    }

    showSuggestions(suggestions, input, suggestionsBox) {
        suggestionsBox.innerHTML = ''; 
    
        suggestions.forEach(user => {
            const suggestionItem = document.createElement('div');
            suggestionItem.classList.add('suggestion-item');
    
            
            suggestionItem.innerHTML = `
                <img src="${user.avatar_url}" alt="${user.login}" width="3rem">
                <span>${user.login}</span>
            `;
    
            suggestionItem.addEventListener('click', () => {
                input.value = user.login; 
                suggestionsBox.innerHTML = ''; 
            });
    
            suggestionsBox.appendChild(suggestionItem);
        });
    }

    update() {
        this.removeAllTr()
        this.entries.forEach((user) => {
            const row = this.createRow()
            
            row.querySelector('.user img').src = `https://github.com/${user.login}.png`
            row.querySelector('.user img').alt = `Imagem de ${user.name}`
            row.querySelector('.user a').href = `https://github.com/${user.login}`
            row.querySelector('.user p').textContent = `${user.name}`
            row.querySelector('.user span').textContent = `${user.login}`

            const reposLink = document.createElement('a')
            reposLink.href = `https://github.com/${user.login}?tab=repositories`
            reposLink.target = "_blank"
            reposLink.textContent = `${user.public_repos}`
            row.querySelector('.repositories').append(reposLink)

            const followersLink = document.createElement('a')
            followersLink.href = `https://github.com/${user.login}?tab=followers`
            followersLink.target = "_blank"
            followersLink.textContent = `${user.followers}`
            row.querySelector('.followers').append(followersLink)
            
            row.querySelector('.remove').onclick = () => {
                const remove = confirm('Tem certeza que deseja remover esse usuário?')
                
                if(remove) {
                    this.delete(user)
                }
            }

            this.tbody.append(row)
        })
        
        this.noFav()
    }

    createRow() {
        const tr = document.createElement('tr')
        tr.innerHTML = 
                    `<td class="user">
                        <a href="https://github.com/LucasFernandesM" target="_blank">
                            <img src="https://github.com/LucasFernandesM.png" alt="Imagem de usuário">
                            <p>Lucas Fernandes</p>
                            <span>/LucasFernandesM</span>
                        </a>
                    </td>
                    <td class="repositories"> <a></a> </td>
                    <td class="followers"> <a></a> </td>
                    <td><button class="remove">X</button></td>`
        return tr
    }

    removeAllTr() {
        this.tbody.querySelectorAll('tr').forEach((tr) => {
            tr.remove()
        })
    }  
}