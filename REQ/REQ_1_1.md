# Casos de uso

## Caso de uso 1

Criar uma sala

### Ator primário

Host do jogo (shared space)

### Nível

Fish

### Stakeholders e interesses

- Host da sala (shared space)
- Jogador (telemóvel)

### Pré-condições

O servidor necessita de estar online

### Gagrantia mínima

O servidor escreve o ocorrido no log de erros

### Garantia de sucesso

O host consegue criar uma sala

### Cenário principal de sucesso

1. Host liga-se à página principal do website
2. Host digita o seu `username`
3. Host carrega em '*Create Room*'
4. Servidor cria uma sala em memória com um ID aleatório
5. Servidor redireciona o Host para essa sala

#### Extensões

2a. O host não digitou o username
2a1. É mostrado um alerta e o host não é redirecionado
