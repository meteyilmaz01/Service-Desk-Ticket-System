namespace ServiceDesk.Application.Interfaces
{
    public interface IGenericService<TResponse, TCreateRequest, TUpdateRequest>
        where TResponse : class
        where TCreateRequest : class
        where TUpdateRequest : class
    {
        Task<IEnumerable<TResponse>> GetAllAsync();
        Task<TResponse> GetByIdAsync(int id);

        Task CreateAsync(TCreateRequest dto);

        Task UpdateAsync(TUpdateRequest dto);

        Task DeleteAsync(int id);
    }
}